import React, { useState } from 'react';
import { useStats } from '../contexts/StatsContext';
import { mockService } from '../services/mockService';

interface CreateModalProps {
  initialPrompt: string;
  onClose: () => void;
  navigate: (p: string) => void;
}

const CreateModal: React.FC<CreateModalProps> = ({ initialPrompt, onClose, navigate }) => {
  const { addLog } = useStats();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: initialPrompt,
    reward: 100
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const finalTitle = formData.title || `Request: ${formData.description.substring(0, 20)}...`;

      const newComp = await mockService.createCompetition({
        title: finalTitle,
        reward: formData.reward
      }, addLog);

      setTimeout(() => {
        navigate(`#/competition/${newComp.id}`);
      }, 500);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2">
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      <div className="bg-white w-full max-w-md sm:max-w-lg p-3 sm:p-4 md:p-5 relative transform transition-all shadow-neo-lg border-3 sm:border-4 border-black">
        <button onClick={onClose} className="absolute top-2 right-2 bg-black text-white hover:bg-neo-pink hover:text-black transition-colors font-bold px-2 py-0.5 border-2 border-black shadow-neo-sm text-xs">
          ESC
        </button>

        <h2 className="text-lg sm:text-xl md:text-2xl font-black text-black mb-1 uppercase tracking-tighter pr-10">Initialize Protocol</h2>
        <div className="h-1 w-10 bg-neo-pink mb-2 border border-black"></div>
        <p className="text-gray-600 font-mono text-[9px] sm:text-[10px] mb-3 font-bold uppercase tracking-widest">Define parameters for distributed agent execution.</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[10px] sm:text-xs font-black text-black uppercase tracking-wider mb-1 border-l-3 border-neo-yellow pl-1.5">Prompt / Directive</label>
            <textarea
              autoFocus
              rows={2}
              required
              className="w-full bg-white border-2 sm:border-3 border-black text-black p-2 focus:shadow-neo outline-none transition-all placeholder-gray-400 font-sans text-xs sm:text-sm font-bold resize-none"
              placeholder="What do you want the agents to create?"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-[10px] sm:text-xs font-black text-black uppercase tracking-wider mb-1 border-l-3 border-neo-blue pl-1.5">Competition Title (Optional)</label>
            <input
              type="text"
              className="w-full bg-white border-2 sm:border-3 border-black text-black p-2 focus:shadow-neo outline-none font-sans font-bold text-xs sm:text-sm"
              placeholder="e.g., Neon City Concept Art"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] sm:text-xs font-black text-black uppercase tracking-wider mb-1 border-l-3 border-neo-green pl-1.5">Reward (USDC)</label>
              <div className="relative">
                <span className="absolute left-2 top-2 text-black font-bold font-mono text-xs sm:text-sm">$</span>
                <input
                  type="number"
                  required
                  className="w-full bg-white border-2 sm:border-3 border-black text-black pl-5 sm:pl-6 p-2 focus:shadow-neo outline-none font-mono text-sm sm:text-base font-bold"
                  value={formData.reward}
                  onChange={e => setFormData({ ...formData, reward: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs font-black text-black uppercase tracking-wider mb-1 border-l-3 border-gray-400 pl-1.5">Platform Fee</label>
              <div className="w-full bg-gray-100 border-2 sm:border-3 border-black text-gray-500 p-2 font-mono text-sm sm:text-base font-bold cursor-not-allowed">
                $10.00
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 sm:py-3 mt-2 bg-neo-yellow text-black font-black uppercase tracking-widest border-2 sm:border-3 border-black shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg transition-all text-xs sm:text-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'BROADCASTING...' : 'DEPLOY COMPETITION'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateModal;