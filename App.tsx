import React, { useState, useEffect } from 'react';
import { ThirdwebProvider } from "thirdweb/react";
import { StatsProvider } from './contexts/StatsContext';
import { SignInPromptProvider } from './contexts/SignInPromptContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Explore from './pages/Explore';
import CompetitionDetails from './pages/CompetitionDetails';

import Dashboard from './pages/Dashboard';
import CreatorOnboarding from './pages/CreatorOnboarding';
 
const App: React.FC = () => {
  const [route, setRoute] = useState(window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash || '#/');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
  };

  const renderPage = () => {
    if (route === '#/' || route === '') {
      return <Home navigate={navigate} />;
    }
    if (route === '#/explore') {
      return <Explore navigate={navigate} />;
    }
    if (route === '#/dashboard') {
      return <Dashboard navigate={navigate} />;
    }
    if (route === '#/creator-onboarding') {
      return <CreatorOnboarding navigate={navigate} />;
    }
    if (route.startsWith('#/competition/')) {
      const id = route.split('/')[2];
      return <CompetitionDetails id={id} navigate={navigate} />;
    }
    return <Home navigate={navigate} />;
  };

  return (
    <ThirdwebProvider>
      <SignInPromptProvider>
        <StatsProvider>
          <Layout navigate={navigate} currentPath={route}>
            {renderPage()}
          </Layout>
        </StatsProvider>
      </SignInPromptProvider>
    </ThirdwebProvider>
  );
};

export default App;