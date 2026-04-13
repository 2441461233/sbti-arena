'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Trophy, ArrowLeft, RefreshCcw } from 'lucide-react';
import { personalities, scenarios } from '@/lib/data';
import Link from 'next/link';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

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
  
  const [histories, setHistories] = useState<Record<string, Message[]>>({});
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [round, setRound] = useState(1);
  
  const [userRole, setUserRole] = useState<string>('');
  const [mobileTab, setMobileTab] = useState<string>('');

  const isMobile = useIsMobile();

  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const pIds = searchParams.getAll('p');
    const sId = searchParams.get('s');
    if (pIds.length === 0 || !sId) {
      router.replace('/select');
      return;
    }
    setActivePersonalities(pIds);
    setMobileTab(pIds[0]);
    setScenarioId(sId);
    
    const scenario = scenarios.find((s) => s.id === sId);
    if (scenario) {
      setScenarioMsg(scenario.firstMessage);
      setAiRole(scenario.aiRole || '');
      setSuggestedInputs(scenario.suggestedInputs || []);
      setUserRole(scenario.userRole || '');
      
      const initialHistories: Record<string, Message[]> = {};
      pIds.forEach(pid => {
        initialHistories[pid] = [
          { id: 'sys', role: 'assistant', content: scenario.firstMessage }
        ];
      });
      setHistories(initialHistories);
    }
  }, [searchParams, router]);

  // Auto scroll the active column to bottom
  useEffect(() => {
    activePersonalities.forEach(pid => {
      const el = columnRefs.current[pid];
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }, [histories, activePersonalities]);

  useEffect(() => {
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
    setActivePersonalities((prev) => {
      const next = prev.filter((p) => p !== id);
      if (id === mobileTab && next.length > 0) {
        setMobileTab(next[0]);
      }
      return next;
    });
  };

  const handleSend = async (forcedText?: string) => {
    const textToSend = forcedText || input;
    if (!textToSend.trim() || loading || winner) return;

    setInput('');
    setLoading(true);

    const userMsgId = Date.now().toString();
    const assistantMsgId = (Date.now() + 1).toString();

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

    await Promise.all(activePersonalities.map(async (pid) => {
      try {
        const context = histories[pid].map(m => ({
          role: m.role,
          content: m.content
        }));
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
    <div className="flex flex-col h-[100dvh] bg-[#F4F7F6] text-slate-800 w-full overflow-hidden">
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
        
        <div className="hidden md:flex flex-1 max-w-xl mx-8 items-center bg-slate-50 px-4 py-2 rounded-full border border-slate-100 text-xs text-slate-500 truncate font-medium">
          <span className="font-bold text-slate-700 mr-2 shrink-0">当前扮演:</span>
          <span className="font-bold text-blue-600 mr-3 shrink-0">{userRole}</span>
          <span className="font-bold text-slate-700 mr-2 shrink-0">舞台设定:</span>
          <span className="truncate">{scenarioMsg}</span>
        </div>
      </header>

      {/* Mobile Tab Bar — always rendered on mobile, switch tabs instantly with no animation */}
      <div className="flex md:hidden border-b border-slate-200 bg-white shrink-0 z-10">
        {activePersonalities.map((pid) => {
          const p = personalities.find(x => x.id === pid);
          if (!p) return null;
          const isActive = mobileTab === pid;
          return (
            <button
              key={pid}
              onClick={() => setMobileTab(pid)}
              className={`flex-1 flex flex-col items-center py-2 px-1 transition-colors relative ${isActive ? 'text-slate-800' : 'text-slate-400'}`}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 border-white shadow-sm"
                style={{ backgroundColor: `${p.color}30` }}
              >
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span>{p.emoji}</span>
                )}
              </div>
              <span className="text-[10px] font-bold mt-0.5 truncate max-w-full px-1">{p.name}</span>
              {isActive && (
                <motion.div
                  layoutId="mobileTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Chat Columns Area */}
      <div className="flex-1 flex overflow-hidden bg-slate-50/50 min-h-0">
        <AnimatePresence>
          {activePersonalities.map((pid, idx) => {
            const p = personalities.find(x => x.id === pid);
            if (!p) return null;

            return (
              <motion.div
                key={pid}
                initial={{ opacity: 0, width: isMobile ? '100%' : 0 }}
                animate={{ opacity: 1, width: isMobile ? '100%' : `${100 / activePersonalities.length}%` }}
                exit={{ opacity: 0, width: isMobile ? '100%' : 0 }}
                transition={{ duration: 0.2 }}
                className={`flex flex-col h-full border-r border-slate-200/60 relative overflow-hidden ${idx === activePersonalities.length - 1 ? 'border-r-0' : ''}`}
                // On mobile: hide non-active tabs via display:none (instant, no ghost from enter/exit overlap)
                style={isMobile && pid !== mobileTab ? { display: 'none' } : undefined}
              >
                {/* Desktop Column Header */}
                <div className="hidden md:flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm border-b border-slate-100 shrink-0 z-10">
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
                      className="flex items-center justify-center space-x-1 px-3 py-1.5 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors shadow-sm font-bold text-xs"
                      title="淘汰 TA"
                    >
                      <X className="w-3 h-3" />
                      <span>淘汰 TA</span>
                    </button>
                  )}
                </div>

                {/* Mobile Column Sub-header: personality info + eliminate button */}
                {!winner && activePersonalities.length > 1 && (
                  <div className="flex md:hidden items-center justify-between px-4 py-2 bg-white/80 border-b border-slate-100 shrink-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-sm text-slate-800">{p.name}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: p.color }}>
                        {p.title}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleEliminate(pid)}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-red-50 text-red-500 active:bg-red-500 active:text-white transition-colors font-bold text-xs"
                    >
                      <X className="w-3 h-3" />
                      <span>淘汰 TA</span>
                    </button>
                  </div>
                )}

                {/* Messages */}
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
                  <div className="h-2" />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Input Area — in normal flow (not absolute), so it naturally pushes messages up */}
      <div className="bg-white border-t border-slate-100 p-4 sm:p-5 z-30 shadow-[0_-8px_30px_rgb(0,0,0,0.05)] shrink-0">
        <div className="max-w-4xl mx-auto">
          {winner ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
                  <Trophy className="w-7 h-7 text-yellow-500" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800">
                    胜出：{personalities.find(p => p.id === winner)?.name}
                  </h2>
                  <p className="text-slate-500 font-medium text-sm mt-0.5">战力值 +1！</p>
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
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-slate-800 font-bold">已达到 10 轮上限 🛑</p>
                <p className="text-sm text-slate-500 font-medium mt-0.5">请淘汰多余人格，选出最终赢家！</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Suggested Inputs — first round only */}
              <AnimatePresence>
                {round === 1 && suggestedInputs.length > 0 && !loading && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-wrap gap-2 justify-center sm:justify-start overflow-hidden"
                  >
                    {suggestedInputs.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(suggestion)}
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-400 text-slate-600 hover:text-slate-800 text-xs font-medium rounded-full shadow-sm hover:shadow transition-all text-left max-w-[160px] sm:max-w-none truncate"
                        title={suggestion}
                      >
                        "{suggestion}"
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Main Input */}
              <div className="flex items-center space-x-2 sm:space-x-3 bg-slate-50 border-2 border-slate-200 rounded-2xl p-2 shadow-inner focus-within:border-slate-800 focus-within:bg-white transition-all">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={
                    isMobile && activePersonalities.length > 1
                      ? `同时发给全部 ${activePersonalities.length} 位...`
                      : `群发给 ${activePersonalities.length} 个人格...`
                  }
                  disabled={loading}
                  className="flex-1 bg-transparent px-3 py-2 outline-none text-slate-800 font-medium placeholder:text-slate-400 disabled:opacity-50 text-base"
                  autoFocus={!isMobile}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || loading}
                  className="px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-slate-800 transition-colors shadow-md flex items-center space-x-2 font-bold shrink-0"
                >
                  <span className="hidden sm:inline">发送</span>
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
