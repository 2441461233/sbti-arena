import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { personalities } from '@/lib/data';
import { Trophy, Users } from 'lucide-react';
import LeaderboardList from '@/components/LeaderboardList';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // If DB is not configured / migrations not applied yet, don't crash the whole homepage.
  // This keeps the site accessible while deployment/env is being set up.
  let leaderboard: any[] = [];
  try {
    leaderboard = await prisma.leaderboard.findMany({
      orderBy: { score: 'desc' },
    });
  } catch (e) {
    console.error('Homepage leaderboard query failed:', e);
    leaderboard = [];
  }

  // Add missing ones with 0 score
  const fullLeaderboard = personalities.map((p) => {
    const found = leaderboard.find((l: any) => l.personalityId === p.id);
    return {
      ...p,
      score: found ? found.score : 0,
    };
  }).sort((a, b) => b.score - a.score);

  const top3 = fullLeaderboard.slice(0, 3);
  const rest = fullLeaderboard.slice(3);

  return (
    <main className="flex min-h-[100dvh] flex-col items-center p-6 sm:p-12 relative overflow-hidden bg-[#F4F7F6]">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#88B04B] opacity-10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#8860D0] opacity-10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl space-y-12 z-10 mt-8">
        {/* 角色图鉴 — top right on desktop, inline on mobile */}
        <div className="flex justify-end">
          <Link href="/personalities" className="flex items-center space-x-2 px-4 py-2 text-slate-500 hover:text-slate-800 bg-white rounded-full shadow-sm hover:shadow transition-all font-bold text-sm">
            <Users className="w-4 h-4" />
            <span>角色图鉴</span>
          </Link>
        </div>
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center space-x-2 bg-white px-4 py-1.5 rounded-full shadow-sm mb-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-bold text-slate-700 tracking-wide uppercase">Leaderboard</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-800">SBTI Arena</h1>
          <p className="text-slate-500 font-medium">全网人格大乱斗 · 选出你的终极取向</p>
        </div>

        {/* Podium for Top 3 — heights: 1st 165px · 2nd 100px · 3rd 55px */}
        <div className="flex items-end justify-center space-x-2 sm:space-x-4 h-[370px] pt-8 max-w-lg mx-auto">
          {/* Rank 2 */}
          {top3[1] && (
            <div className="flex flex-col items-center justify-end w-1/3 sm:w-32 h-full group">
              <div className="relative mb-3 flex flex-col items-center group-hover:-translate-y-2 transition-transform">
                <div 
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-3xl sm:text-4xl shadow-[0_4px_15px_rgb(203,213,225,0.6)] border-4 border-slate-300 z-10 relative mt-2"
                  style={{ backgroundColor: `${top3[1].color}30` }}
                >
                  {top3[1].imageUrl ? (
                    <img src={top3[1].imageUrl} alt={top3[1].name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span>{top3[1].emoji}</span>
                  )}
                  <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 text-2xl z-30 drop-shadow-sm">
                    🥈
                  </div>
                </div>
                <div className="flex flex-col items-center mt-4 space-y-1">
                  <span className="font-bold text-slate-800 text-sm sm:text-base text-center leading-none">{top3[1].name}</span>
                  <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full text-white shadow-sm" style={{ backgroundColor: top3[1].color }}>
                    {top3[1].title}
                  </span>
                  <span className="text-xs font-bold text-slate-500 pt-0.5">{top3[1].score} pts</span>
                </div>
              </div>
              <div className="w-full bg-gradient-to-t from-slate-300 to-slate-100 rounded-t-2xl border-t border-x border-white shadow-[inset_0_4px_12px_rgb(0,0,0,0.04)] h-[100px] flex items-start justify-center pt-3 relative overflow-hidden">
                <span className="text-4xl font-black text-slate-300/70 drop-shadow-sm z-10">2</span>
              </div>
            </div>
          )}

          {/* Rank 1 */}
          {top3[0] && (
            <div className="flex flex-col items-center justify-end w-1/3 sm:w-40 h-full group z-10">
              <div className="relative mb-3 flex flex-col items-center group-hover:-translate-y-2 transition-transform">
                {/* Crown */}
                <div className="text-2xl sm:text-3xl mb-1 drop-shadow-md animate-bounce" style={{ animationDuration: '2.5s' }}>👑</div>
                <div 
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-4xl sm:text-5xl shadow-[0_8px_24px_rgb(250,204,21,0.55)] border-4 border-yellow-400 z-10 relative"
                  style={{ backgroundColor: `${top3[0].color}40` }}
                >
                  {top3[0].imageUrl ? (
                    <img src={top3[0].imageUrl} alt={top3[0].name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span>{top3[0].emoji}</span>
                  )}
                  <div className="absolute inset-0 rounded-full border border-white/50 pointer-events-none" />
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-3xl sm:text-4xl z-30 drop-shadow-sm">
                    🥇
                  </div>
                </div>
                <div className="flex flex-col items-center mt-5 space-y-1">
                  <span className="font-black text-slate-800 text-base sm:text-lg text-center leading-none">{top3[0].name}</span>
                  <span className="text-xs sm:text-sm font-bold px-2.5 py-0.5 rounded-full text-white shadow-sm" style={{ backgroundColor: top3[0].color }}>
                    {top3[0].title}
                  </span>
                  <span className="text-sm font-bold text-yellow-600 pt-0.5">{top3[0].score} pts</span>
                </div>
              </div>
              <div className="w-full bg-gradient-to-t from-yellow-400 via-yellow-200 to-yellow-100 rounded-t-3xl border-t-2 border-x-2 border-white shadow-[inset_0_4px_14px_rgb(0,0,0,0.06)] h-[165px] flex items-start justify-center pt-5 sm:pt-7 relative overflow-hidden">
                <span className="text-6xl font-black text-yellow-400/50 drop-shadow-md z-10">1</span>
                <div className="absolute top-0 left-[-50%] right-[-50%] h-[200px] w-[200%] bg-white/20 -rotate-45 transform pointer-events-none" />
              </div>
            </div>
          )}

          {/* Rank 3 */}
          {top3[2] && (
            <div className="flex flex-col items-center justify-end w-1/3 sm:w-32 h-full group">
              <div className="relative mb-3 flex flex-col items-center group-hover:-translate-y-2 transition-transform">
                <div 
                  className="w-14 h-14 sm:w-18 sm:h-18 rounded-full flex items-center justify-center text-2xl sm:text-3xl shadow-[0_4px_12px_rgb(205,127,50,0.35)] border-4 border-[#CD7F32] z-10 relative mt-2"
                  style={{ backgroundColor: `${top3[2].color}30` }}
                >
                  {top3[2].imageUrl ? (
                    <img src={top3[2].imageUrl} alt={top3[2].name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span>{top3[2].emoji}</span>
                  )}
                  <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 text-xl z-30 drop-shadow-sm">
                    🥉
                  </div>
                </div>
                <div className="flex flex-col items-center mt-4 space-y-1">
                  <span className="font-bold text-slate-800 text-xs sm:text-sm text-center leading-none">{top3[2].name}</span>
                  <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white shadow-sm" style={{ backgroundColor: top3[2].color }}>
                    {top3[2].title}
                  </span>
                  <span className="text-xs font-bold text-slate-400 pt-0.5">{top3[2].score} pts</span>
                </div>
              </div>
              <div className="w-full bg-gradient-to-t from-orange-200 to-orange-50 rounded-t-xl border-t border-x border-white shadow-[inset_0_4px_10px_rgb(0,0,0,0.02)] h-[55px] flex items-start justify-center pt-1.5 relative overflow-hidden">
                <span className="text-2xl font-black text-orange-300/70 drop-shadow-sm z-10">3</span>
              </div>
            </div>
          )}
        </div>

        {/* Client Component for the rest of the list */}
        <div className="max-w-lg mx-auto w-full">
          <LeaderboardList initialItems={rest} />
        </div>

        <div className="pt-2 pb-12 max-w-lg mx-auto w-full">
          <Link
            href="/select"
            className="block w-full py-5 bg-slate-800 text-white text-center font-bold text-lg rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-slate-700 hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            开始打榜 🚀
          </Link>
        </div>
      </div> {/* end max-w-2xl */}
    </main>
  );
}
