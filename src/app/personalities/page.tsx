import { personalities } from '@/lib/data';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PersonalitiesPage() {
  return (
    <main className="min-h-screen bg-[#F4F7F6] p-6 sm:p-12 text-slate-800">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center space-x-4 mb-10">
          <Link href="/" className="p-2 bg-white rounded-full shadow-sm hover:shadow transition-all text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight">SBTI 角色图鉴</h1>
            <p className="text-slate-500 font-medium mt-1">
              这里是 SBTI 宇宙的 25 位常驻嘉宾。看看哪一款最对你的胃口？
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {personalities.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col hover:-translate-y-1 transition-transform group">
              <div 
                className="h-24 w-full flex items-end justify-center pb-4 relative transition-colors"
                style={{ backgroundColor: `${p.color}40` }}
              >
                <div 
                  className="w-20 h-20 bg-white rounded-full overflow-hidden flex items-center justify-center text-4xl shadow-md border-4 border-white absolute -bottom-10 transition-transform group-hover:scale-105"
                  style={{ color: p.color }}
                >
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span>{p.emoji}</span>
                  )}
                </div>
              </div>
              
              <div className="pt-14 px-6 pb-6 flex-1 flex flex-col items-center text-center">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-bold text-xl">{p.name}</h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: p.color }}>
                    {p.title}
                  </span>
                </div>
                
                <div className="w-full mt-2 bg-slate-50 rounded-xl p-4 text-left flex-1 border border-slate-100">
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">"{p.prompt.split('。')[1] || p.prompt}"</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
