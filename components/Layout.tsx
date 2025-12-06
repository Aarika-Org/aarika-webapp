import React, { useState } from 'react';
import { useStats } from '../contexts/StatsContext';
import StatsSidebar from './StatsSidebar';
import { MOCK_USER } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  navigate: (path: string) => void;
  currentPath: string;
}

const Layout: React.FC<LayoutProps> = ({ children, navigate, currentPath }) => {
  const { isOpen } = useStats();
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
          </nav>

          {/* Right: User & Actions - Pushed to edge */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 ml-auto">
            {/* AVAX C-Chain Badge - Red with green indicator */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-red-500 to-red-600 border-2 border-black shadow-neo-sm">
              <div className="h-2.5 w-2.5 bg-green-400 rounded-full animate-pulse"></div>
              <div className="flex flex-col leading-none">
                <span className="text-[9px] font-black font-mono text-white tracking-wider">AVAX</span>
                <span className="text-[7px] font-bold font-mono text-red-100">C-CHAIN</span>
              </div>
            </div>

            {/* User Avatar */}
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80">
              <div className="h-8 w-8 sm:h-9 sm:w-9 bg-neo-pink border-2 border-black flex items-center justify-center text-xs font-bold shadow-neo-sm text-black">
                {MOCK_USER.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-bold font-mono text-black hidden lg:block">@{MOCK_USER.username}</span>
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