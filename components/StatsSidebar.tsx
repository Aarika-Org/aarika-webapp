import React, { useEffect, useRef } from 'react';
import { useStats } from '../contexts/StatsContext';

const StatsSidebar: React.FC = () => {
  const { isOpen, toggleStats, logs } = useStats();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[450px] bg-white shadow-neo-lg z-50 transform transition-transform duration-300 ease-in-out border-l-4 border-black flex flex-col font-mono text-sm">
      {/* Header */}
      <div className="p-4 border-b-4 border-black flex justify-between items-center bg-neo-yellow">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-black animate-pulse border border-white"></div>
          <h2 className="text-black font-black uppercase tracking-widest text-xs">Protocol Events</h2>
        </div>
        <div className="flex space-x-4">
          <button onClick={toggleStats} className="text-black font-bold hover:text-neo-pink text-lg">✕</button>
        </div>
      </div>

      {/* Logs Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
        {logs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-black space-y-2 opacity-50">
            <span className="text-4xl">⚡</span>
            <p className="text-xs uppercase tracking-widest font-bold">Awaiting on-chain activity...</p>
          </div>
        )}
        {[...logs].reverse().map((log) => {
          const explorerUrl = (log as any)?.details?.smartContract?.explorerUrl || (log as any)?.details?.explorerUrl;
          return (
          <div key={log.id} className="border-2 border-black p-3 relative group shadow-neo-sm bg-white hover:translate-x-1 transition-transform">
            {/* Timeline dot */}
            <div className={`absolute -left-[9px] top-4 w-3 h-3 border-2 border-black ${log.source === 'Contract' ? 'bg-neo-pink' : 'bg-neo-blue'
              }`}></div>

            <div className="flex justify-between text-[10px] mb-2">
              <span className={`uppercase tracking-wider font-black px-1 border border-black ${log.source === 'Contract' ? 'bg-neo-pink text-black' :
                log.source === 'Thirdweb' ? 'bg-neo-blue text-black' :
                  log.source === 'Pinata' ? 'bg-neo-yellow text-black' :
                    log.source === 'Relayer' ? 'bg-neo-green text-black' :
                      'bg-gray-200 text-black'
                }`}>
                {log.source}
              </span>
              <span className="font-bold text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
            </div>

            <p className="text-black font-bold mb-2 text-xs uppercase">{log.event}</p>

            {log.details && (
              <div className="bg-gray-100 border-2 border-black p-2 overflow-x-auto">
                <pre className="text-[10px] text-black font-mono leading-relaxed">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
                {explorerUrl && (
                  <div className="mt-2">
                    <a href={explorerUrl} target="_blank" rel="noreferrer" className="inline-block text-[10px] font-bold uppercase border-2 border-black bg-white px-2 py-1 hover:bg-neo-yellow">View on Explorer</a>
                  </div>
                )}
              </div>
            )}
          </div>
        )})}
        <div ref={endRef} />
      </div>

      {/* Footer info */}
      <div className="p-3 border-t-4 border-black bg-black text-[10px] text-white text-center font-mono uppercase tracking-widest font-bold">
        Avalanche C-Chain • x402 Protocol
      </div>
    </div>
  );
};

export default StatsSidebar;