import React, { useState } from 'react';
import { useStats } from '../contexts/StatsContext';
import { useSignInPrompt } from '../contexts/SignInPromptContext';
import StatsSidebar from './StatsSidebar';
import SignInButton from './SignInButton';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
  navigate: (path: string) => void;
  currentPath: string;
}

const Layout: React.FC<LayoutProps> = ({ children, navigate, currentPath }) => {
  const { isOpen } = useStats();
  const { showPrompt, hidePrompt } = useSignInPrompt();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className={`min-h-screen flex flex-col bg-neo-white text-black selection:bg-neo-pink selection:text-black relative overflow-x-hidden ${isOpen ? 'lg:mr-[450px]' : ''} transition-all duration-300`}>

      {/* Background Grid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-grid opacity-100"></div>
      </div>

      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center">

          {/* Left: Logo */}
          <div className="flex-shrink-0 cursor-pointer group" onClick={() => navigate('#/')}>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter uppercase text-black hover:text-neo-pink transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.05em' }}>
              <span className="bg-neo-pink px-1.5 sm:px-2 py-0.5 sm:py-1 mr-0.5 border-2 border-black">A</span>arika
            </h1>
          </div>

          {/* Center: Desktop Navigation */}
          <nav className="hidden md:flex items-center justify-center flex-1 space-x-3 lg:space-x-4">
            <button
              onClick={() => navigate('#/')}
              className={`text-xs font-bold uppercase tracking-widest px-4 lg:px-5 py-2 border-2 border-black transition-all ${currentPath === '#/' ? 'bg-neo-yellow text-black shadow-neo-sm' : 'bg-white text-black hover:bg-neo-yellow hover:shadow-neo-sm'}`}
            >
              Create
            </button>
            <button
              onClick={() => navigate('#/explore')}
              className={`text-xs font-bold uppercase tracking-widest px-4 lg:px-5 py-2 border-2 border-black transition-all ${currentPath === '#/explore' ? 'bg-neo-blue text-black shadow-neo-sm' : 'bg-white text-black hover:bg-neo-blue hover:shadow-neo-sm'}`}
            >
              Requests
            </button>
            <button
              onClick={() => navigate('#/dashboard')}
              className={`text-xs font-bold uppercase tracking-widest px-4 lg:px-5 py-2 border-2 border-black transition-all ${currentPath === '#/dashboard' ? 'bg-neo-green text-black shadow-neo-sm' : 'bg-white text-black hover:bg-neo-green hover:shadow-neo-sm'}`}
            >
              Onboard Agent
            </button>
          </nav>

          {/* Right: User & Actions - Pushed to edge */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 ml-auto relative">
            {/* AVAX C-Chain Badge - Red with green indicator */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-red-500 to-red-600 border-2 border-black shadow-neo-sm">
              <div className="h-2.5 w-2.5 bg-green-400 rounded-full animate-pulse"></div>
              <div className="flex flex-col leading-none">
                <span className="text-[9px] font-black font-mono text-white tracking-wider">AVAX</span>
                <span className="text-[7px] font-bold font-mono text-red-100">C-CHAIN</span>
              </div>
            </div>

            {/* Sign In Button with Prompt */}
            <div className="relative">
              <SignInButton />

              {/* Sign In Prompt - Below the button */}
              <AnimatePresence>
                {showPrompt && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-2 z-50 whitespace-nowrap"
                  >
                    <div className="bg-neo-yellow border-3 border-black px-4 py-3 shadow-neo relative">
                      {/* Arrow pointing up to button */}
                      <div className="absolute -top-3 right-6 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[12px] border-b-black"></div>
                      <div className="absolute -top-2 right-[26px] w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[10px] border-b-neo-yellow"></div>

                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-black text-black uppercase text-xs">Sign in first!</p>
                          <p className="font-bold text-black text-[10px]">Click above to continue</p>
                        </div>
                        <button
                          onClick={hidePrompt}
                          className="bg-black text-white px-2 py-1 font-bold text-xs border-2 border-black hover:bg-neo-pink hover:text-black transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-1.5 border-2 border-black bg-white shadow-neo-sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <div className="space-y-1">
                <div className="w-4 h-0.5 bg-black"></div>
                <div className="w-4 h-0.5 bg-black"></div>
                <div className="w-4 h-0.5 bg-black"></div>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b-2 border-black p-3 space-y-2 absolute w-full z-50 shadow-neo">
            <button
              onClick={() => { navigate('#/'); setIsMobileMenuOpen(false); }}
              className={`block w-full text-left px-3 py-2 text-sm font-bold uppercase border-2 border-black ${currentPath === '#/' ? 'bg-neo-yellow' : 'bg-white'}`}
            >
              Create
            </button>
            <button
              onClick={() => { navigate('#/explore'); setIsMobileMenuOpen(false); }}
              className={`block w-full text-left px-3 py-2 text-sm font-bold uppercase border-2 border-black ${currentPath === '#/explore' ? 'bg-neo-blue' : 'bg-white'}`}
            >
              Requests
            </button>
            <button
              onClick={() => { navigate('#/dashboard'); setIsMobileMenuOpen(false); }}
              className={`block w-full text-left px-3 py-2 text-sm font-bold uppercase border-2 border-black ${currentPath === '#/dashboard' ? 'bg-neo-green' : 'bg-white'}`}
            >
              Onboard Agent
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 w-full relative z-10 pt-16 sm:pt-20">
        {children}
      </main>

      <StatsSidebar />
    </div>
  );
};

export default Layout;