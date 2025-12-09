import React, { useEffect, useState } from 'react';
import { Competition, CompetitionStatus } from '../types';
import { getCompetitions } from '../services/api';
import { useActiveAccount } from 'thirdweb/react';

interface ExploreProps {
  navigate: (path: string) => void;
}

const Explore: React.FC<ExploreProps> = ({ navigate }) => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'LIVE' | 'COMPLETED'>('ALL');
  const account = useActiveAccount();

  useEffect(() => {
    (async () => {
      try {
        if (!account?.address) { setCompetitions([]); return; }
        const data = await getCompetitions();
        const mapped: Competition[] = (data || []).map((c: any) => ({
          id: c._id,
          title: c.prompt,
          description: c.prompt,
          rewardAmount: Number(c.rewardTotal ?? 0),
          entryFee: 0,
          status: (c.status === 'active' ? CompetitionStatus.LIVE : c.status === 'completed' ? CompetitionStatus.COMPLETED : CompetitionStatus.CREATED),
          creatorId: c.creatorWallet || 'unknown',
          createdAt: c.createdAt ? new Date(c.createdAt.$date || c.createdAt).getTime() : Date.now(),
          agentCount: Array.isArray(c.agents)
            ? c.agents.filter((a: any) => a && a.submission && (a.submission.previewCid || a.submission.commitment || a.submission.agentId)).length
            : 0,
          submissions: [],
        }));
        // Filter by connected wallet address
        const addr = account.address.toLowerCase();
        const filteredByWallet = mapped.filter((c) => (c.creatorId || '').toLowerCase() === addr);
        setCompetitions(filteredByWallet);
      } catch (e) {
        setCompetitions([]);
      }
    })();
  }, [account?.address]);

  const filteredCompetitions = competitions.filter(comp => {
    if (filter === 'ALL') return true;
    if (filter === 'LIVE') return comp.status === CompetitionStatus.LIVE || comp.status === CompetitionStatus.JUDGING;
    if (filter === 'COMPLETED') return comp.status === CompetitionStatus.COMPLETED;
    return true;
  });

  const emptyCopy = (() => {
    if (filter === 'LIVE') return {
      title: 'No live battles... yet',
      body: 'The stage is set and the lights are warm, but the curtain waits for a creator to call the first shot.'
    };
    if (filter === 'COMPLETED') return {
      title: 'No legends written here',
      body: 'When a winner claims the crown and the vault pays out, their tale will be etched in this hall.'
    };
    return {
      title: 'The arena is quiet',
      body: 'No prompts echo through the halls—yet. Be the spark that starts the first challenge.'
    };
  })();

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-12">
      {/* Header - Responsive */}
      <div className="flex flex-col gap-4 sm:gap-6 border-b-2 border-black pb-6 sm:pb-8 mb-8 sm:mb-12">
        <div>
          <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-8xl font-black text-black mb-2 tracking-tighter uppercase">Requests</h2>
          <p className="text-gray-600 font-mono text-xs sm:text-sm font-bold">Your history of digital bounties.</p>
        </div>

        {/* Filter Buttons - Responsive */}
        <div className="flex items-center">
          <div className="flex flex-wrap gap-1 sm:space-x-2 bg-white border-2 border-black p-1 shadow-neo-sm">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 sm:px-6 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold uppercase transition-all border-2 border-transparent ${filter === 'ALL' ? 'bg-neo-yellow text-black border-black shadow-neo-sm' : 'text-black hover:bg-gray-100'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('LIVE')}
              className={`px-3 sm:px-6 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold uppercase transition-all border-2 border-transparent ${filter === 'LIVE' ? 'bg-neo-green text-black border-black shadow-neo-sm' : 'text-black hover:bg-gray-100'}`}
            >
              Live
            </button>
            <button
              onClick={() => setFilter('COMPLETED')}
              className={`px-3 sm:px-6 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold uppercase transition-all border-2 border-transparent ${filter === 'COMPLETED' ? 'bg-neo-pink text-black border-black shadow-neo-sm' : 'text-black hover:bg-gray-100'}`}
            >
              Completed
            </button>
          </div>
        </div>
      </div>

      {/* Competition Cards Grid or Empty State */}
      {filteredCompetitions.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center border-2 border-black p-8 sm:p-12 bg-white shadow-neo min-h-[240px]">
          <div className="inline-block px-3 py-1 mb-3 text-[10px] font-bold uppercase border-2 border-black bg-neo-yellow shadow-neo-sm">Nothing here... yet</div>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight uppercase text-black mb-3">{emptyCopy.title}</h3>
          <p className="text-gray-600 text-sm sm:text-base max-w-xl font-medium leading-relaxed">
            {emptyCopy.body}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {filteredCompetitions.map((comp) => (
            <div
              key={comp.id}
              onClick={() => navigate(`#/competition/${comp.id}`)}
              className="group relative bg-white border-2 border-black hover:-translate-y-2 hover:shadow-neo-lg transition-all duration-200 cursor-pointer overflow-hidden flex flex-col h-[320px] sm:h-[380px] lg:h-[450px] shadow-neo"
            >
              <div className={`h-2 sm:h-3 w-full border-b-2 border-black ${comp.status === CompetitionStatus.LIVE ? 'bg-neo-green' :
                comp.status === CompetitionStatus.JUDGING ? 'bg-neo-yellow' :
                  'bg-gray-300'
                }`}></div>

              <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col relative z-10">
                <div className="flex justify-between items-start mb-4 sm:mb-6">
                  <span className={`inline-block px-2 sm:px-3 py-0.5 sm:py-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest border-2 border-black shadow-neo-sm ${comp.status === CompetitionStatus.LIVE ? 'bg-neo-green text-black' :
                    comp.status === CompetitionStatus.JUDGING ? 'bg-neo-yellow text-black' :
                      'bg-gray-200 text-black'
                    }`}>
                    {comp.status}
                  </span>
                  <span className="font-mono text-[10px] sm:text-xs text-gray-500 font-bold">#{comp.id}</span>
                </div>

                <div className="mb-auto">
                  <h3 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-black text-black mb-2 sm:mb-4 group-hover:text-neo-pink transition-colors line-clamp-2 uppercase tracking-tight leading-none">{comp.title}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 sm:line-clamp-3 font-medium leading-relaxed border-l-3 sm:border-l-4 border-black pl-3 sm:pl-4">
                    {comp.description}
                  </p>
                </div>

                <div className="pt-4 sm:pt-6 border-t-2 border-black flex items-end justify-between font-mono mt-4">
                  <div className="flex flex-col">
                    <span className="text-[8px] sm:text-[10px] text-gray-500 uppercase mb-1 font-bold">Reward Pool</span>
                    <div className="flex items-center text-black text-xl sm:text-2xl lg:text-3xl font-bold">
                      {comp.rewardAmount} <span className="text-xs sm:text-sm text-neo-green ml-1 font-black">USDC</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-black">{comp.agentCount}</div>
                    <span className="text-[8px] sm:text-[10px] text-gray-500 uppercase font-bold">Entries</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Explore;