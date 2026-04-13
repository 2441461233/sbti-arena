'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Trophy, ArrowLeft, RefreshCcw } from 'lucide-react';
import { personalities, scenarios } from '@/lib/data';
import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  status?: 'loading' | 'done' | 'error';
}

export default function ChatArena() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [activePersonalities, setActivePersonalities] = useState<string[]>([]);
  const [scenarioId, setScenarioId] = useState<string>('');
  
  const [scenarioMsg, setScenarioMsg] = useState('');
  const [aiRole, setAiRole] = useState('');
  const [suggestedInputs, setSuggestedInputs] = useState<string[]>([]);
  
  // We maintain separate message history for each personality for parallel columns
  const [histories, setHistories] = useState<Record<string, Message[]>>({});
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [round, setRound] = useState(1);
  
  const [userRole, setUserRole] = useState<string>('');

  // Create refs for each column
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const pIds = searchParams.getAll('p');
    const sId = searchParams.get('s');
    if (pIds.length === 0 || !sId) {
      router.replace('/select');
      return;
    }
    setActivePersonalities(pIds);
    setScenarioId(sId);
    
    const scenario = scenarios.find((s) => s.id === sId);
    if (scenario) {
      setScenarioMsg(scenario.firstMessage);
      setAiRole(scenario.aiRole || '');
      setSuggestedInputs(scenario.suggestedInputs || []);
      setUserRole(scenario.userRole || '');
      
      // Initialize histories
      const initialHistories: Record<string, Message[]> = {};
      pIds.forEach(pid => {
        initialHistories[pid] = [
          { id: 'sys', role: 'assistant', content: scenario.firstMessage }
        ];
      });
      setHistories(initialHistories);
    }
  }, [searchParams, router]);

  // Auto scroll columns
  useEffect(() => {
    activePersonalities.forEach(pid => {
      const el = columnRefs.current[pid];
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }, [histories, activePersonalities]);

  useEffect(() => {
    // As soon as there is only one personality left, persist the win.
    // The previous `round > 1` gate could prevent saving when user eliminates quickly.
    if (activePersonalities.length === 1 && !winner) {
      handleWin(activePersonalities[0]);
    }
  }, [activePersonalities, winner, round]);

  const handleWin = async (winId: string) => {
    setWinner(winId);
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personalityId: winId }),
      });
      if (res.ok) {
        // 提交胜者后预取最新榜单数据，用户回到首页时数字与排名按最新值重排
        router.prefetch('/');
      } else {
        const errText = await res.text().catch(() => '');
        console.error('Leaderboard update failed:', res.status, errText);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEliminate = (id: string) => {
    setActivePersonalities((prev) => prev.filter((p) => p !== id));
  };

  const handleSend = async (forcedText?: string) => {
    const textToSend = forcedText || input;
    if (!textToSend.trim() || loading || winner) return;

    setInput('');
    setLoading(true);

    const userMsgId = Date.now().toString();
    const assistantMsgId = (Date.now() + 1).toString();

    // Optimistically add user message and loading assistant message to all active histories
    setHistories(prev => {
      const next = { ...prev };
      activePersonalities.forEach(pid => {
        next[pid] = [
          ...next[pid],
          { id: userMsgId, role: 'user', content: textToSend },
          { id: assistantMsgId, role: 'assistant', content: '', status: 'loading' }
        ];
      });
      return next;
    });

    setRound(prev => prev + 1);

    // Fetch in parallel
    await Promise.all(activePersonalities.map(async (pid) => {
      try {
        // Prepare context for this specific personality
        // Here we map histories[pid], which ALREADY includes the initial scenario.firstMessage as an 'assistant' message
        // and does NOT include the user message we just sent (since it's only in React state update queue)
        const context = histories[pid].map(m => ({
          role: m.role,
          content: m.content
        }));
        // We append the user message manually here
        context.push({ role: 'user', content: textToSend });

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personalityId: pid,
            scenarioId,
            messages: context
          })
        });
        const data = await res.json();
        
        setHistories(prev => {
          const next = { ...prev };
          const pHistory = [...next[pid]];
          // Find and update the loading message
          const lastMsgIndex = pHistory.findIndex(m => m.id === assistantMsgId);
          if (lastMsgIndex !== -1) {
            pHistory[lastMsgIndex] = {
              ...pHistory[lastMsgIndex],
              content: data.reply,
              status: 'done'
            };
          }
          next[pid] = pHistory;
          return next;
        });
      } catch (e) {
        setHistories(prev => {
          const next = { ...prev };
          const pHistory = [...next[pid]];
          const lastMsgIndex = pHistory.findIndex(m => m.id === assistantMsgId);
          if (lastMsgIndex !== -1) {
            pHistory[lastMsgIndex] = {
              ...pHistory[lastMsgIndex],
              content: '（连接断开）',
              status: 'error'
            };
          }
          next[pid] = pHistory;
          return next;
        });
      }
    }));

    setLoading(false);
  };

  if (!scenarioId) return null;

  return (
    <div className="flex flex-col h-[100dvh] bg-[#F4F7F6] text-slate-800 w-full relative overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-white border-b border-slate-100 z-20 shadow-sm shrink-0">
        <div className="flex items-center space-x-3">
          <Link href="/select" className="p-2 -ml-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-black text-lg">SBTI 竞技场</h1>
            <p className="text-xs text-slate-500 font-bold tracking-wider">ROUND {Math.min(round, 10)}/10</p>
          </div>
        </div>
        
        {/* Scenario Display in Header */}
        <div className="hidden md:flex flex-1 max-w-xl mx-8 items-center bg-slate-50 px-4 py-2 rounded-full border border-slate-100 text-xs text-slate-500 truncate font-medium">
          <span className="font-bold text-slate-700 mr-2 shrink-0">当前扮演:</span>
          <span className="font-bold text-blue-600 mr-3 shrink-0">{userRole}</span>
          <span className="font-bold text-slate-700 mr-2 shrink-0">舞台设定:</span>
          <span className="truncate">{scenarioMsg}</span>
        </div>

      </header>

      {/* Parallel Chat Columns Area */}
      <div className="flex-1 flex overflow-hidden bg-slate-50/50 pb-28">
        <AnimatePresence>
          {activePersonalities.map((pid, idx) => {
            const p = personalities.find(x => x.id === pid);
            if (!p) return null;
            
            return (
              <motion.div 
                key={pid}
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: `${100 / activePersonalities.length}%` }}
                exit={{ opacity: 0, width: 0 }}
                className={`flex flex-col h-full border-r border-slate-200/60 relative ${idx === activePersonalities.length - 1 ? 'border-r-0' : ''}`}
              >
                {/* Column Header: Personality Info */}
                <div 
                  className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm border-b border-slate-100 shrink-0 z-10"
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm border-2 border-white"
                      style={{ backgroundColor: `${p.color}30` }}
                    >
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <span>{p.emoji}</span>
                      )}
                    </div>
                    <div>
                      <h2 className="font-black text-slate-800 leading-tight">{p.name}</h2>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: p.color }}>
                        {p.title}
                      </span>
                    </div>
                  </div>
                  
                  {!winner && activePersonalities.length > 1 && (
                    <button 
                      onClick={() => handleEliminate(pid)}
                      className="flex items-center justify-center space-x-1 px-3 py-1.5 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors shadow-sm font-bold text-xs group/btn"
                      title="淘汰 TA"
                    >
                      <X className="w-3 h-3" />
                      {/* Eliminate Button */}
                      <span className="hidden sm:inline">淘汰 TA</span>
                    </button>
                  )}
                </div>

                {/* Column Messages */}
                <div 
                  className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar"
                  ref={el => { columnRefs.current[pid] = el; }}
                >
                  {histories[pid]?.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      {msg.id === 'sys' && (
                        <div className="w-full bg-white px-4 py-3 rounded-2xl shadow-sm border border-slate-100 text-sm text-slate-600 mb-2">
                          <span className="font-bold text-slate-700 block mb-2 text-xs">
                            (你扮演 <span className="text-blue-600">{userRole}</span>，对方扮演 <span className="text-blue-600">{aiRole}</span>)
                          </span>
                          <span className="font-bold text-slate-800 mr-1">{aiRole}:</span>
                          {msg.content}
                        </div>
                      )}
                      
                      {msg.id !== 'sys' && msg.role === 'user' && (
                        <div className="bg-slate-800 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[85%] shadow-sm text-sm font-medium">
                          {msg.content}
                        </div>
                      )}

                      {msg.id !== 'sys' && msg.role === 'assistant' && (
                        <div 
                          className="bg-white border-2 px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed shadow-sm max-w-[90%]"
                          style={{ borderColor: `${p.color}40` }}
                        >
                          {msg.status === 'loading' ? (
                            <div className="flex items-center space-x-1.5 text-slate-400 h-5">
                              <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            </div>
                          ) : (
                            <p className="text-slate-700">{msg.content}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="h-4" /> {/* Bottom spacer */}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Global Input Area or Winner Area */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 sm:p-6 z-30 shadow-[0_-10px_40px_rgb(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto">
          {winner ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-yellow-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800">
                    胜出：{personalities.find(p => p.id === winner)?.name}
                  </h2>
                  <p className="text-slate-500 font-medium text-sm mt-1">战力值 +1！</p>
                </div>
              </div>
              <div className="flex space-x-3 w-full sm:w-auto">
                <Link
                  href="/"
                  prefetch={false}
                  className="flex-1 sm:flex-none px-6 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold transition-colors text-center"
                >
                  榜单
                </Link>
                <button onClick={() => window.location.reload()} className="flex-1 sm:flex-none px-6 py-3 bg-slate-800 text-white hover:bg-slate-700 rounded-xl font-bold shadow-lg transition-colors flex justify-center items-center space-x-2">
                  <RefreshCcw className="w-4 h-4" />
                  <span>再来一局</span>
                </button>
              </div>
            </motion.div>
          ) : round > 10 ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-800 font-bold">已达到 10 轮上限 🛑</p>
                <p className="text-sm text-slate-500 font-medium">请淘汰多余人格，选出最终赢家！</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Suggested Inputs */}
              {round === 1 && suggestedInputs.length > 0 && !loading && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap gap-2 justify-center sm:justify-start"
                >
                  {suggestedInputs.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(suggestion)}
                      className="px-4 py-2 bg-white border border-slate-200 hover:border-slate-400 text-slate-600 hover:text-slate-800 text-sm font-medium rounded-full shadow-sm hover:shadow transition-all text-left max-w-full truncate"
                      title={suggestion}
                    >
                      "{suggestion}"
                    </button>
                  ))}
                </motion.div>
              )}
              
              {/* Main Input */}
              <div className="flex items-center space-x-3 bg-slate-50 border-2 border-slate-200 rounded-2xl p-2 shadow-inner focus-within:border-slate-800 focus-within:bg-white transition-all">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={`群发给 ${activePersonalities.length} 个人格...`}
                  disabled={loading}
                  className="flex-1 bg-transparent px-4 py-2 outline-none text-slate-800 font-medium placeholder:text-slate-400 disabled:opacity-50 text-base"
                  autoFocus
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || loading}
                  className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-slate-800 transition-colors shadow-md flex items-center space-x-2 font-bold"
                >
                  <span>发送</span>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
