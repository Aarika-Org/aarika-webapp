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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 h-16 sm:h-20 flex justify-between items-center">
          {/* Custom Typography Logo */}
          <div className="flex items-center cursor-pointer group" onClick={() => navigate('#/')}>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter uppercase text-black hover:text-neo-pink transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.05em' }}>
              <span className="bg-neo-pink px-2 py-1 mr-1 border-2 border-black">A</span>arika
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
            <button
              onClick={() => navigate('#/')}
              className={`text-xs lg:text-sm font-bold uppercase tracking-widest px-4 lg:px-6 py-2 lg:py-3 border-2 border-black transition-all ${currentPath === '#/' ? 'bg-neo-yellow text-black shadow-neo-sm' : 'bg-white text-black hover:bg-neo-yellow hover:shadow-neo-sm'}`}
            >
              Create
            </button>
            <button
              onClick={() => navigate('#/explore')}
              className={`text-xs lg:text-sm font-bold uppercase tracking-widest px-4 lg:px-6 py-2 lg:py-3 border-2 border-black transition-all ${currentPath === '#/explore' ? 'bg-neo-blue text-black shadow-neo-sm' : 'bg-white text-black hover:bg-neo-blue hover:shadow-neo-sm'}`}
            >
              Requests
            </button>
          </nav>

          <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-6">
            {/* Network Badge - Hide on small screens */}
            <div className="hidden lg:flex items-center space-x-2 px-3 py-2 bg-black border-2 border-black shadow-neo-sm rounded-none">
              <div className="h-2 w-2 bg-neo-green border border-white"></div>
              <span className="text-xs font-bold font-mono text-white">AVAX C-CHAIN</span>
            </div>

            {/* User Avatar */}
            <div className="flex items-center space-x-2 cursor-pointer hover:opacity-80">
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-neo-pink border-2 border-black flex items-center justify-center text-xs sm:text-sm font-bold shadow-neo-sm text-black">
                {MOCK_USER.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs sm:text-sm font-bold font-mono text-black hidden sm:block">@{MOCK_USER.username}</span>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 border-2 border-black bg-white shadow-neo-sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <div className="space-y-1">
                <div className="w-5 h-0.5 bg-black"></div>
                <div className="w-5 h-0.5 bg-black"></div>
                <div className="w-5 h-0.5 bg-black"></div>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b-2 border-black p-4 space-y-3 absolute w-full z-50 shadow-neo">
            <button
              onClick={() => { navigate('#/'); setIsMobileMenuOpen(false); }}
              className={`block w-full text-left px-4 py-3 font-bold uppercase border-2 border-black ${currentPath === '#/' ? 'bg-neo-yellow' : 'bg-white'}`}
            >
              Create
            </button>
            <button
              onClick={() => { navigate('#/explore'); setIsMobileMenuOpen(false); }}
              className={`block w-full text-left px-4 py-3 font-bold uppercase border-2 border-black ${currentPath === '#/explore' ? 'bg-neo-blue' : 'bg-white'}`}
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