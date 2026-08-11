import React, { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { AuthScreen } from './components/AuthScreen';
import { AppShell } from './components/AppShell';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'landing' | 'auth' | 'dashboard'>('landing');

  if (currentScreen === 'landing') {
    return (
      <LandingPage
        onGetStarted={() => setCurrentScreen('auth')}
        onSignIn={() => setCurrentScreen('auth')}
      />
    );
  }

  if (currentScreen === 'auth') {
    return (
      <AuthScreen
        onLogin={() => setCurrentScreen('dashboard')}
      />
    );
  }

  return (
    <AppShell
      onLogout={() => setCurrentScreen('landing')}
    />
  );
}

