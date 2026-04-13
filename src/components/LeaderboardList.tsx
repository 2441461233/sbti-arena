'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LeaderboardList({ initialItems }: { initialItems: any[] }) {
  const [expanded, setExpanded] = useState(false);

  const displayedItems = expanded ? initialItems : initialItems.slice(0, 3); // Show 4-6 by default

  return (
    <div className="w-full relative">
      {/* 使用 CSS mask 做内容渐隐，避免覆盖背景造成矩形色块 */}
      <div
        className="relative"
        style={
          !expanded
            ? {
                // 底部 96px 做渐隐，顶部完全可见
                WebkitMaskImage:
                  'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) calc(100% - 96px), rgba(0,0,0,0) 100%)',
                maskImage:
                  'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) calc(100% - 96px), rgba(0,0,0,0) 100%)',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
              }
            : undefined
        }
      >
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {displayedItems.map((item, index) => {
              const globalIndex = index + 3; // Since Top 3 are handled outside
              return (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-100 overflow-hidden relative"
                >
                  {/* Card Color Accent */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: item.color }} />
                  
                  <div className="flex items-center w-full pl-2">
                    <div className="flex-shrink-0 w-8 sm:w-10 text-center">
                      <span className="text-lg font-black text-slate-400">
                        {globalIndex + 1}
                      </span>
                    </div>
                    
                    <div 
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden flex items-center justify-center text-xl sm:text-2xl shadow-inner border-2 border-white relative z-10 flex-shrink-0"
                      style={{ backgroundColor: `${item.color}20` }}
                    >
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <span>{item.emoji}</span>
                      )}
                    </div>

                    <div className="ml-3 sm:ml-4 flex-1 truncate">
                      <div className="flex items-baseline space-x-2 truncate">
                        <h3 className="font-bold text-base sm:text-lg text-slate-800 truncate">{item.name}</h3>
                        <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full text-white shrink-0" style={{ backgroundColor: item.color }}>
                          {item.title}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-center ml-2">
                      <span className="text-xl sm:text-2xl font-black text-slate-800 leading-none">{item.score}</span>
                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Wins</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {initialItems.length > 3 && (
        <div className="mt-4 flex justify-center relative z-20">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center space-x-2 px-6 py-2.5 bg-white text-slate-500 hover:text-slate-800 font-bold rounded-full shadow-sm hover:shadow transition-all border border-slate-200 text-sm z-20 relative"
          >
            <span>{expanded ? '收起榜单' : '查看完整榜单'}</span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  );
}
