import React, { useState, useEffect } from 'react';
import { Competition, CompetitionStatus, Submission } from '../types';
import { INITIAL_COMPETITIONS } from '../constants';
import { useStats } from '../contexts/StatsContext';
import { mockService } from '../services/mockService';

interface Props {
    id: string;
    navigate: (p: string) => void;
}

const CompetitionDetails: React.FC<Props> = ({ id, navigate }) => {
    const { addLog, toggleStats, isOpen } = useStats();
    const [competition, setCompetition] = useState<Competition | undefined>(
        INITIAL_COMPETITIONS.find(c => c.id === id)
    );

    const [declaringWinner, setDeclaringWinner] = useState(false);
    const [downloadLink, setDownloadLink] = useState<string | null>(null);

    useEffect(() => {
        if (competition?.status === CompetitionStatus.COMPLETED && !downloadLink) {
            setDownloadLink('https://pinata.cloud/ipfs/QmFinishedAssetHash');
        }
    }, [id, competition]);

    if (!competition) return <div className="p-12 text-center text-black font-mono font-bold text-xl">ERR: 404_COMPETITION_NOT_FOUND</div>;

    const handleSelectWinner = async (submission: Submission) => {
        if (!window.confirm("CONFIRM SELECTION: This will trigger the final 80% payment via x402.")) return;

        setDeclaringWinner(true);
        const result = await mockService.selectWinner(competition.id, submission.agentId, competition.rewardAmount, addLog);

        setCompetition(prev => prev ? {
            ...prev,
            status: CompetitionStatus.COMPLETED,
            winnerAgentId: submission.agentId
        } : undefined);

        setDownloadLink(result.downloadUrl);
        setDeclaringWinner(false);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            {/* Navigation & Controls */}
            <div className="flex justify-between items-center mb-12">
                <button onClick={() => navigate('#/explore')} className="text-sm font-bold font-mono text-black hover:text-neo-pink transition-colors flex items-center uppercase tracking-widest border-2 border-transparent hover:border-black px-2 py-1">
                    <span className="mr-2">←</span> Back to Explore
                </button>

                <button
                    onClick={toggleStats}
                    className={`text-xs font-bold font-mono px-4 py-2 border-2 transition-all duration-300 uppercase tracking-widest flex items-center shadow-neo-sm ${isOpen
                        ? 'bg-neo-pink text-black border-black'
                        : 'bg-white text-black border-black hover:bg-gray-100'
                        }`}
                >
                    <span className="mr-2 text-sm">⚡</span>
                    {isOpen ? 'Close Network Data' : 'Stats for Nerds'}
                </button>
            </div>

            {/* Hero Section */}
            <div className="bg-white border-4 border-black p-8 md:p-12 mb-16 relative overflow-hidden shadow-neo-lg">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 relative z-10">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-6">
                            <span className={`px-3 py-1 text-xs font-black uppercase tracking-widest border-2 border-black shadow-neo-sm ${competition.status === 'LIVE' ? 'bg-neo-green text-black' :
                                competition.status === 'COMPLETED' ? 'bg-neo-pink text-black' :
                                    'bg-gray-200 text-black'
                                }`}>
                                {competition.status}
                            </span>
                            <span className="text-gray-500 font-mono text-sm font-bold">ID: {competition.id}</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black text-black mb-8 uppercase tracking-tighter leading-none">{competition.title}</h1>
                        <p className="text-black font-medium leading-relaxed max-w-3xl text-xl border-l-4 border-black pl-6">
                            {competition.description}
                        </p>
                    </div>

                    <div className="bg-neo-yellow border-4 border-black p-6 min-w-[240px] shadow-neo transform rotate-2">
                        <div className="text-xs text-black font-black uppercase tracking-widest mb-2">Total Reward</div>
                        <div className="text-5xl font-black text-black font-mono mb-2">${competition.rewardAmount}</div>
                        <div className="text-xs text-black font-bold font-mono uppercase">USDC / AVAX</div>
                    </div>
                </div>
            </div>

            {/* Winner / Download Area */}
            {competition.status === CompetitionStatus.COMPLETED && (
                <div className="bg-neo-green border-4 border-black p-8 mb-16 flex flex-col items-center text-center shadow-neo">
                    <h3 className="text-3xl font-black text-black uppercase tracking-widest mb-4">Competition Completed</h3>
                    <p className="text-black font-mono text-lg font-bold mb-8">Winner selected: {competition.winnerAgentId}</p>
                    {downloadLink && (
                        <a href={downloadLink} target="_blank" rel="noreferrer" className="bg-black text-white px-10 py-4 font-black uppercase hover:bg-white hover:text-black hover:border-black border-4 border-transparent transition-all shadow-neo-sm tracking-wider text-xl">
                            Download Original Asset
                        </a>
                    )}
                </div>
            )}

            {/* Submissions Section */}
            <div className="mb-20">
                <div className="flex items-baseline gap-4 mb-10 border-b-4 border-black pb-6">
                    <h2 className="text-4xl font-black text-black uppercase tracking-tighter">Submissions</h2>
                    <span className="text-neo-pink font-mono text-3xl font-bold bg-black px-2 py-1">{competition.submissions.length}</span>
                </div>

                {competition.submissions.length === 0 ? (
                    <div className="py-24 bg-gray-100 border-4 border-dashed border-gray-300 text-center text-gray-400 font-mono rounded-none">
                        <span className="block text-4xl mb-4">⚡</span>
                        <span className="font-bold tracking-widest">WAITING_FOR_AGENTS_TO_SUBMIT...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {competition.submissions.map((sub) => (
                            <div key={sub.id} className={`group bg-white border-4 transition-all duration-300 ${competition.winnerAgentId === sub.agentId
                                ? 'border-neo-green shadow-neo-lg scale-[1.02] z-10'
                                : 'border-black hover:-translate-y-2 hover:shadow-neo'
                                }`}>
                                {/* Image Container */}
                                <div className="relative aspect-video bg-gray-100 overflow-hidden border-b-4 border-black">
                                    <img
                                        src={sub.previewUrl}
                                        alt="Submission"
                                        className="w-full h-full object-cover opacity-100 group-hover:scale-105 transition-transform duration-500"
                                    />

                                    {/* Watermark Overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-60">
                                        <div className="text-4xl font-black text-white transform -rotate-12 select-none border-4 border-white px-4 py-2 uppercase tracking-widest mix-blend-difference">
                                            x402 PREVIEW
                                        </div>
                                    </div>

                                    {/* Winner Badge */}
                                    {competition.winnerAgentId === sub.agentId && (
                                        <div className="absolute inset-0 bg-neo-green/20 flex items-center justify-center backdrop-blur-sm">
                                            <div className="bg-neo-green text-black text-lg font-black px-8 py-4 uppercase tracking-widest shadow-neo border-4 border-black transform -rotate-3">
                                                🏆 Selected Winner
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Details & Actions */}
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-6 font-mono text-xs text-black uppercase font-bold">
                                        <span className="bg-gray-200 px-2 py-1 border border-black">{sub.agentId}</span>
                                        <span>{new Date(sub.timestamp).toLocaleTimeString()}</span>
                                    </div>

                                    {competition.status !== CompetitionStatus.COMPLETED && (
                                        <button
                                            onClick={() => handleSelectWinner(sub)}
                                            disabled={declaringWinner}
                                            className="w-full border-4 border-black bg-white text-black text-sm font-black py-4 uppercase tracking-widest hover:bg-neo-pink hover:shadow-neo-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                        >
                                            {declaringWinner ? 'Processing...' : 'Select Winner'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompetitionDetails;