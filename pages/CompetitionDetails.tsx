import React, { useState, useEffect } from 'react';
import { Competition, CompetitionStatus, Submission } from '../types';
import { INITIAL_COMPETITIONS } from '../constants';
import { useStats } from '../contexts/StatsContext';
import { useActiveAccount } from 'thirdweb/react';
import { avalancheFuji } from 'thirdweb/chains';
import api, { getCompetition, selectWinner, PaymentRequirement, getDeliveryStatus } from '../services/api';

interface Props {
    id: string;
    navigate: (p: string) => void;
}

const CompetitionDetails: React.FC<Props> = ({ id, navigate }) => {
    const { addLog, toggleStats, isOpen } = useStats();
    const [competition, setCompetition] = useState<Competition | undefined>(
        INITIAL_COMPETITIONS.find(c => c.id === id)
    );
    const [attemptedFetch, setAttemptedFetch] = useState(false);
    const [agentsById, setAgentsById] = useState<Record<string, any>>({});

    const [declaringWinner, setDeclaringWinner] = useState(false);
    const [downloadLink, setDownloadLink] = useState<string | null>(null);
    const [viewing, setViewing] = useState<Submission | null>(null);
    const account = useActiveAccount();
    const [confirming, setConfirming] = useState<{ open: boolean; submission: Submission | null }>(() => ({ open: false, submission: null }));

    // Confirmation modal handlers (component scope)
    const openConfirm = (submission: Submission) => setConfirming({ open: true, submission });
    const closeConfirm = () => setConfirming({ open: false, submission: null });
    const confirmProceed = async () => {
        if (!confirming.submission) return;
        const sub = confirming.submission;
        closeConfirm();
        await handleSelectWinner(sub);
    };

    useEffect(() => {
        if (competition?.status === CompetitionStatus.COMPLETED && !downloadLink) {
            setDownloadLink('https://pinata.cloud/ipfs/QmFinishedAssetHash');
        }
    }, [id, competition]);

    // Fetch from backend if not found in mock list
    useEffect(() => {
        let cancelled = false;
        async function load() {
            const existsInMock = INITIAL_COMPETITIONS.find(c => c.id === id);
            if (!existsInMock) {
                try {
                    if (!account?.address || typeof account.signMessage !== 'function') { setAttemptedFetch(true); return; }
                    const ts = Math.floor(Date.now() / 1000).toString();
                    const message = `AARIKA_GET_COMPETITION\naddress:${account.address.toLowerCase()}\ncompetition:${id}\nts:${ts}`;
                    const signature = await account.signMessage({ message });
                    const doc = await getCompetition(id, { address: account.address, signature, timestamp: ts });
                    if (cancelled) return;
                    // Map backend document to frontend Competition type
                    const toMs = (d: any) => d ? new Date(d.$date || d).getTime() : Date.now();
                    const toGatewayUrl = (cid?: string) => cid ? `https://gateway.pinata.cloud/ipfs/${cid}` : '';
                    const mappedSubs: Submission[] = Array.isArray(doc.agents)
                        ? doc.agents
                            .filter((a: any) => a.submission && a.submission.previewCid)
                            .map((a: any) => ({
                                id: a.submission.commitment || a.submission.agentId,
                                agentId: a.agentId || a.submission.agentId,
                                previewUrl: toGatewayUrl(a.submission.previewCid),
                                timestamp: toMs(a.submission.submittedAt),
                            }))
                        : [];
                    const mapped: Competition = {
                        id: doc._id,
                        title: doc.prompt || 'Competition',
                        description: doc.prompt || '',
                        rewardAmount: typeof doc.rewardTotal === 'number' ? doc.rewardTotal : Number(doc.rewardTotal || 0),
                        entryFee: 0,
                        status: (doc.status && doc.status.toUpperCase() === 'ACTIVE') ? CompetitionStatus.LIVE : (doc.status && doc.status.toUpperCase() === 'COMPLETED') ? CompetitionStatus.COMPLETED : CompetitionStatus.CREATED,
                        creatorId: doc.creatorWallet || 'unknown',
                        createdAt: toMs(doc.createdAt),
                        agentCount: Array.isArray(doc.agents) ? doc.agents.length : 0,
                        submissions: mappedSubs,
                        winnerAgentId: doc.winner || undefined,
                    };
                    setCompetition(mapped);
                    if (Array.isArray(doc.agents)) {
                        const map: Record<string, any> = {};
                        for (const a of doc.agents) {
                            const key = a.agentId || a.submission?.agentId;
                            if (key) map[key] = a;
                        }
                        setAgentsById(map);
                    } else {
                        setAgentsById({});
                    }
                } catch (e) {
                    // ignore, will render 404 below
                } finally {
                    if (!cancelled) setAttemptedFetch(true);
                }
            } else {
                if (!cancelled) setAttemptedFetch(true);
            }
        }
        setAttemptedFetch(false);
        load();
        return () => { cancelled = true; };
    }, [id, account?.address]);

    if (!competition) {
        if (!attemptedFetch) {
            return <div className="p-12 text-center text-black font-mono font-bold text-xl">LOADING...</div>;
        }
        return <div className="p-12 text-center text-black font-mono font-bold text-xl">ERR: 404_COMPETITION_NOT_FOUND</div>;
    }

    const handleSelectWinner = async (submission: Submission) => {
        if (!competition) return;
        if (!account?.address) {
            alert('Please connect your wallet first');
            return;
        }

        setDeclaringWinner(true);
        try {
            // First attempt: expect 402 with payment requirements
            const initial = await selectWinner({ competitionId: competition.id, winningAgentId: submission.agentId });
            if (initial.status === 402) {
                const pay = initial.data as PaymentRequirement;
                const accepts0 = pay.accepts?.[0];
                const payToAddress = accepts0?.payTo as `0x${string}`;
                const amount = accepts0?.maxAmountRequired as string;
                const network = accepts0?.network || `eip155:${avalancheFuji.id}`;
                if (!payToAddress || !amount) throw new Error('Invalid payment requirements');

                // Build ERC-3009 typed data and sign
                const now = Math.floor(Date.now() / 1000);
                const validAfter = now.toString();
                const validBefore = (now + 172800).toString();
                const nonce = (() => {
                    const bytes = new Uint8Array(32);
                    crypto.getRandomValues(bytes);
                    return ('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')) as `0x${string}`;
                })();

                const chainIdFromNetwork = Number((network || '').split(':')[1] || avalancheFuji.id);
                const verifyingContract = (accepts0?.asset as `0x${string}`) || ('0x5425890298aed601595a70AB815c96711a31Bc65' as `0x${string}`);

                const typedData = {
                    types: {
                        TransferWithAuthorization: [
                            { name: 'from', type: 'address' },
                            { name: 'to', type: 'address' },
                            { name: 'value', type: 'uint256' },
                            { name: 'validAfter', type: 'uint256' },
                            { name: 'validBefore', type: 'uint256' },
                            { name: 'nonce', type: 'bytes32' },
                        ],
                    },
                    primaryType: 'TransferWithAuthorization' as const,
                    domain: {
                        name: 'USD Coin',
                        version: '2',
                        chainId: chainIdFromNetwork,
                        verifyingContract,
                    },
                    message: {
                        from: account.address as `0x${string}`,
                        to: payToAddress,
                        value: amount,
                        validAfter,
                        validBefore,
                        nonce,
                    },
                };

                if (typeof account.signTypedData !== 'function') throw new Error('Wallet does not support signTypedData');
                const signature = await account.signTypedData(typedData);

                const paymentPayload = {
                    x402Version: pay.x402Version || 1,
                    scheme: 'exact',
                    network,
                    payload: {
                        signature,
                        authorization: {
                            from: account.address,
                            to: payToAddress,
                            value: amount,
                            validAfter,
                            validBefore,
                            nonce,
                        },
                    },
                };
                const paymentHeader = btoa(JSON.stringify(paymentPayload));

                const confirmed = await selectWinner({ competitionId: competition.id, winningAgentId: submission.agentId }, paymentHeader);
                if (confirmed.status !== 200) {
                    const err = confirmed.data as any;
                    throw new Error((err && (err.error || err.detail)) || 'Winner selection failed');
                }

                const okData = confirmed.data as any;
                setCompetition(prev => prev ? { ...prev, status: CompetitionStatus.COMPLETED, winnerAgentId: submission.agentId } : prev);
                if (okData.downloadUrl) {
                    setDownloadLink(okData.downloadUrl);
                } else {
                    // fallback poll
                    try {
                        for (let i = 0; i < 10; i++) {
                            const s = await getDeliveryStatus(competition.id);
                            if (s.ready && s.downloadUrl) { setDownloadLink(s.downloadUrl); break; }
                            await new Promise(r => setTimeout(r, 1500));
                        }
                    } catch { /* ignore */ }
                }
            } else if (initial.status === 200) {
                const okData = initial.data as any;
                setCompetition(prev => prev ? { ...prev, status: CompetitionStatus.COMPLETED, winnerAgentId: submission.agentId } : prev);
                if (okData.downloadUrl) setDownloadLink(okData.downloadUrl);
            } else {
                const err = initial.data as any;
                throw new Error((err && (err.error || err.detail)) || 'Unexpected response');
            }
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Failed to select winner');
        } finally {
            setDeclaringWinner(false);
        }
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

            {viewing && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/70" onClick={() => setViewing(null)}></div>
                    <div className="absolute inset-0 flex items-center justify-center p-4" onClick={() => setViewing(null)}>
                        <div className="bg-white border-4 border-black shadow-neo-lg max-w-5xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-4 border-b-4 border-black">
                                <div className="flex items-center gap-3">
                                    {(() => {
                                        const ag = (agentsById as any)[viewing.agentId] || {};
                                        const short = (addr?: string) => addr ? `${addr.slice(0,6)}...${addr.slice(-4)}` : 'unknown';
                                        return (
                                            <>
                                                <span className="px-2 py-1 border-2 border-black bg-neo-yellow font-mono text-xs font-black uppercase">Submission</span>
                                                <span className="px-2 py-1 border-2 border-black bg-white font-mono text-xs">{ag.name || viewing.agentId}</span>
                                                <span className="px-2 py-1 border-2 border-black bg-white font-mono text-xs">{short(ag.wallet)}</span>
                                            </>
                                        );
                                    })()}
                                </div>
                                <button className="border-2 border-black bg-white px-3 py-1 font-black uppercase text-xs hover:bg-neo-pink" onClick={() => setViewing(null)}>Close</button>
                            </div>
                            <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div className="border-2 border-black bg-gray-50">
                                    <img src={viewing.previewUrl} alt="Preview" className="w-full h-auto object-contain" />
                                </div>
                                <div className="border-2 border-black p-4 bg-white">
                                    {(() => {
                                        const ag = (agentsById as any)[viewing.agentId] || {};
                                        const sub = ag.submission || {};
                                        const row = (label: string, value?: string, isLink?: boolean) => (
                                            <div className="flex items-start justify-between gap-3 py-2 border-b border-gray-200">
                                                <span className="font-mono text-xs font-bold uppercase text-gray-600">{label}</span>
                                                {isLink && value ? (
                                                    <a className="font-mono text-xs text-black underline break-all" href={`https://gateway.pinata.cloud/ipfs/${value}`} target="_blank" rel="noreferrer">{value}</a>
                                                ) : (
                                                    <span className="font-mono text-xs text-black break-all">{value || '—'}</span>
                                                )}
                                            </div>
                                        );
                                        return (
                                            <>
                                                {row('Agent', ag.name || viewing.agentId)}
                                                {row('Wallet', ag.wallet)}
                                                {row('Status', ag.status)}
                                                {row('Committed Tx', sub.commitTx)}
                                                {row('Preview Tx', sub.previewTx)}
                                                {row('Preview CID', sub.previewCid, true)}
                                                {row('Commitment', sub.commitment)}
                                                {row('Submitted At', new Date(viewing.timestamp).toLocaleString())}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {confirming.open && confirming.submission && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/70" onClick={closeConfirm}></div>
                    <div className="absolute inset-0 flex items-center justify-center p-4" onClick={closeConfirm}>
                        <div className="bg-white border-4 border-black shadow-neo-lg max-w-xl w-full" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6 border-b-4 border-black">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="px-2 py-1 border-2 border-black bg-neo-pink font-mono text-xs font-black uppercase">Finale</span>
                                    <span className="font-mono text-xs text-gray-600 font-bold uppercase tracking-widest">Confirm Winner Selection</span>
                                </div>
                                <h3 className="text-3xl font-black tracking-tight uppercase leading-snug text-black">Crown the Champion</h3>
                                <p className="mt-3 text-black font-mono text-sm font-bold leading-relaxed">
                                    This action will trigger the remaining 80% payment via x402 and unlock the original asset for delivery.
                                </p>
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="sm:col-span-2 border-2 border-black bg-gray-50 p-3">
                                        <div className="text-[10px] font-black uppercase text-gray-600">Winning Agent</div>
                                        <div className="font-mono text-sm text-black break-all">{confirming.submission.agentId}</div>
                                    </div>
                                    <div className="border-2 border-black bg-neo-yellow p-3">
                                        <div className="text-[10px] font-black uppercase text-black">Reward Remainder</div>
                                        <div className="font-mono text-lg font-black text-black">${(competition.rewardAmount * 0.9).toFixed(2)}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 flex gap-3">
                                <button onClick={closeConfirm} className="flex-1 border-4 border-black bg-white text-black font-black uppercase tracking-widest py-3 hover:bg-gray-100">Cancel</button>
                                <button onClick={confirmProceed} className="flex-1 border-4 border-black bg-neo-green text-black font-black uppercase tracking-widest py-3 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg transition-all">Confirm & Pay</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
                            <span className="font-mono font-bold uppercase text-gray-600">Creator</span>
                            <span className="border-2 border-black px-2 py-1 bg-white shadow-neo-sm font-mono text-black">{competition.creatorId}</span>
                            <span className="font-mono font-bold uppercase text-gray-600 ml-4">Entries</span>
                            <span className="border-2 border-black px-2 py-1 bg-neo-yellow shadow-neo-sm font-mono text-black">{competition.agentCount}</span>
                        </div>
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
                                <div className="relative aspect-video bg-gray-100 overflow-hidden border-b-4 border-black cursor-zoom-in" onClick={() => setViewing(sub)}>
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
                                    {(() => {
                                        const ag = agentsById[sub.agentId] || {};
                                        const short = (addr?: string) => addr ? `${addr.slice(0,6)}...${addr.slice(-4)}` : 'unknown';
                                        return (
                                            <div className="flex justify-between items-center mb-6 font-mono text-xs text-black uppercase font-bold">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-gray-200 px-2 py-1 border border-black">{ag.name || 'Agent'}</span>
                                                    <span className="px-2 py-1 border border-black bg-white">{short(ag.wallet)}</span>
                                                </div>
                                                <span>{new Date(sub.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                        );
                                    })()}

                                    {competition.status !== CompetitionStatus.COMPLETED && (
                                        <button
                                            onClick={() => openConfirm(sub)}
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