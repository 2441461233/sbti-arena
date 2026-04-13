'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { personalities, scenarios } from '@/lib/data';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SelectPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPersonalities, setSelectedPersonalities] = useState<string[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  const togglePersonality = (id: string) => {
    if (selectedPersonalities.includes(id)) {
      setSelectedPersonalities((prev) => prev.filter((p) => p !== id));
    } else {
      if (selectedPersonalities.length < 3) {
        setSelectedPersonalities((prev) => [...prev, id]);
      }
    }
  };

  const handleNext = () => {
    if (step === 1 && selectedPersonalities.length >= 2) {
      setStep(2);
    } else if (step === 2 && selectedScenario) {
      const params = new URLSearchParams();
      selectedPersonalities.forEach((p) => params.append('p', p));
      params.append('s', selectedScenario);
      router.push(`/chat?${params.toString()}`);
    }
  };

  return (
    <main className="flex min-h-[100dvh] flex-col bg-[#F4F7F6] text-slate-800 selection:bg-slate-200 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#A0DAA9] opacity-20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FFB88C] opacity-20 rounded-full blur-[120px] pointer-events-none" />

      <div className="flex-1 w-full max-w-lg mx-auto flex flex-col p-6 z-10">
        <header className="flex items-center mb-8 h-12">
          {step === 2 ? (
            <button onClick={() => setStep(1)} className="p-2 -ml-2 rounded-full bg-white shadow-sm hover:shadow transition-all text-slate-500 hover:text-slate-800">
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <Link href="/" className="p-2 -ml-2 rounded-full bg-white shadow-sm hover:shadow transition-all text-slate-500 hover:text-slate-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}
          <div className="flex-1 flex justify-center space-x-3">
            <div className={`h-2 w-12 rounded-full transition-colors duration-500 ${step >= 1 ? 'bg-slate-800' : 'bg-slate-200'}`} />
            <div className={`h-2 w-12 rounded-full transition-colors duration-500 ${step >= 2 ? 'bg-slate-800' : 'bg-slate-200'}`} />
          </div>
          <div className="w-9" /> {/* Spacer */}
        </header>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              <div className="mb-8 text-center space-y-2">
                <h1 className="text-3xl font-black tracking-tight text-slate-800">挑选出战人格</h1>
                <p className="text-slate-500 font-medium">请选择 2-3 位你喜欢的 SBTI 人格参与竞技</p>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar pr-2 -mr-2 space-y-3 pb-28">
                <div className="grid grid-cols-2 gap-4">
                  {personalities.map((p) => {
                    const isSelected = selectedPersonalities.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => togglePersonality(p.id)}
                        className={`flex flex-col items-center p-4 rounded-3xl border-2 text-center transition-all relative overflow-hidden group ${
                          isSelected
                            ? 'bg-white shadow-[0_8px_20px_rgb(0,0,0,0.08)] -translate-y-1'
                            : 'border-transparent bg-white/60 hover:bg-white shadow-sm hover:shadow hover:-translate-y-0.5'
                        }`}
                        style={{
                          borderColor: isSelected ? p.color : 'transparent',
                        }}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full text-white flex items-center justify-center text-xs font-bold shadow-sm" style={{ backgroundColor: p.color }}>
                            ✓
                          </div>
                        )}
                        
                        <div 
                          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-inner border-4 border-white mb-3"
                          style={{ backgroundColor: `${p.color}30` }}
                        >
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <span>{p.emoji}</span>
                          )}
                        </div>

                        <span className="font-black text-lg text-slate-800">{p.name}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white mt-1" style={{ backgroundColor: p.color }}>
                          {p.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 flex flex-col"
            >
              <div className="mb-8 text-center space-y-2">
                <h1 className="text-3xl font-black tracking-tight text-slate-800">挑选对线场景</h1>
                <p className="text-slate-500 font-medium">为他们挑选一个竞技舞台</p>
              </div>

              <div className="flex-1 space-y-4 pb-28">
                {scenarios.map((s) => {
                  const isSelected = selectedScenario === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedScenario(s.id)}
                      className={`w-full flex flex-col p-6 rounded-3xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-slate-800 bg-white shadow-[0_8px_20px_rgb(0,0,0,0.08)] -translate-y-1'
                          : 'border-transparent bg-white/60 hover:bg-white shadow-sm hover:shadow hover:-translate-y-0.5'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-3">
                        <span className="font-black text-xl text-slate-800">{s.title}</span>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                            ✓
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-slate-500 font-medium leading-relaxed">{s.description}</span>
                      <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600 italic">
                        "{s.firstMessage}"
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#F4F7F6] via-[#F4F7F6]/90 to-transparent pointer-events-none z-20">
          <div className="max-w-lg mx-auto w-full pointer-events-auto">
            <button
              onClick={handleNext}
              disabled={
                (step === 1 && selectedPersonalities.length < 2) ||
                (step === 2 && !selectedScenario)
              }
              className="w-full flex items-center justify-center space-x-2 py-5 bg-slate-800 text-white font-bold text-lg rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-slate-700 hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:hover:-translate-y-0"
            >
              <span>{step === 1 ? `下一步 (${selectedPersonalities.length}/3)` : '进入竞技场 ⚔️'}</span>
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
