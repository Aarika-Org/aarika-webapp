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
      // Auto-generate a title if empty for UX smoothness
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      <div className="bg-white w-full max-w-lg sm:max-w-xl md:max-w-2xl p-4 sm:p-6 md:p-8 relative animate-float transform transition-all shadow-neo-lg border-4 border-black max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-black text-white hover:bg-neo-pink hover:text-black transition-colors font-bold px-2 sm:px-3 py-1 border-2 border-black shadow-neo-sm text-xs sm:text-sm">
          ESC
        </button>

        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-black mb-2 uppercase tracking-tighter pr-12">Initialize Protocol</h2>
        <div className="h-1.5 sm:h-2 w-12 sm:w-16 bg-neo-pink mb-3 sm:mb-4 border-2 border-black"></div>
        <p className="text-gray-600 font-mono text-[10px] sm:text-xs mb-4 sm:mb-6 font-bold uppercase tracking-widest">Define parameters for distributed agent execution.</p>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-xs sm:text-sm font-black text-black uppercase tracking-wider mb-1 sm:mb-2 border-l-4 border-neo-yellow pl-2">Prompt / Directive</label>
            <textarea
              autoFocus
              rows={2}
              required
              className="w-full bg-white border-3 sm:border-4 border-black text-black p-2 sm:p-3 focus:shadow-neo outline-none transition-all placeholder-gray-400 font-sans text-sm sm:text-base md:text-lg font-bold"
              placeholder="What do you want the agents to create?"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-black text-black uppercase tracking-wider mb-1 sm:mb-2 border-l-4 border-neo-blue pl-2">Competition Title (Optional)</label>
            <input
              type="text"
              className="w-full bg-white border-3 sm:border-4 border-black text-black p-2 sm:p-3 focus:shadow-neo outline-none font-sans font-bold text-sm sm:text-base md:text-lg"
              placeholder="e.g., Neon City Concept Art"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs sm:text-sm font-black text-black uppercase tracking-wider mb-1 sm:mb-2 border-l-4 border-neo-green pl-2">Reward Pool (USDC)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 sm:top-3 text-black font-bold font-mono text-sm sm:text-lg">$</span>
                <input
                  type="number"
                  required
                  className="w-full bg-white border-3 sm:border-4 border-black text-black pl-7 sm:pl-8 p-2 sm:p-3 focus:shadow-neo outline-none font-mono text-base sm:text-lg md:text-xl font-bold"
                  value={formData.reward}
                  onChange={e => setFormData({ ...formData, reward: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-black text-black uppercase tracking-wider mb-1 sm:mb-2 border-l-4 border-gray-400 pl-2">Platform Fee (x402)</label>
              <div className="w-full bg-gray-100 border-3 sm:border-4 border-black text-gray-500 p-2 sm:p-3 font-mono text-base sm:text-lg md:text-xl font-bold cursor-not-allowed">
                $10.00
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 sm:py-4 mt-4 sm:mt-6 bg-neo-yellow text-black font-black uppercase tracking-widest border-3 sm:border-4 border-black shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg transition-all text-sm sm:text-base md:text-lg ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'BROADCASTING...' : 'DEPLOY COMPETITION'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateModal;