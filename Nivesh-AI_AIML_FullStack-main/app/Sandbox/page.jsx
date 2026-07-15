'use client';

import { useState, useEffect } from 'react';
import { useUser } from '../lib/authClient';
import SandboxOnboarding from '../components/SandboxOnboarding';
import SandboxTradingTerminal from '../components/SandboxTradingTerminal';
import { RealtimeProvider } from '../context/RealtimeContext';

export default function SandboxPage() {
  const { user, isLoading } = useUser();
  const [isOnboarded, setIsOnboarded] = useState(null); // null = checking
  const [userCollege, setUserCollege] = useState(null);

  useEffect(() => {
    if (user?.sub) checkOnboardingStatus();
  }, [user]);

  const checkOnboardingStatus = async () => {
    try {
      const r = await fetch(`/api/tradeverse/profile/${encodeURIComponent(user.sub)}`);
      if (r.ok) {
        const d = await r.json();
        setIsOnboarded(true);
        setUserCollege(d.user_profile?.college_name);
      } else {
        setIsOnboarded(false);
      }
    } catch {
      setIsOnboarded(false);
    }
  };

  if (isLoading || isOnboarded === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-b from-[#083344] via-[#155e75] to-[#083344]">
        <div className="w-10 h-10 border-4 border-color-4/30 border-t-color-4 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-b from-[#083344] via-[#155e75] to-[#083344]">
        <div className="bg-n-6 border border-n-6 rounded-2xl p-10 max-w-sm text-center">
          <h2 className="text-2xl font-bold text-white mb-3 uppercase tracking-wider">SIGN IN REQUIRED</h2>
          <p className="text-n-4 mb-6">Please sign in to access the trading sandbox</p>
          <button onClick={() => window.location.href = '/api/auth/login'}
            className="px-8 py-3 bg-color-4 hover:bg-color-4/80 text-white rounded-xl font-semibold transition-colors">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!isOnboarded) {
    return (
      <SandboxOnboarding
        userId={user.sub}
        onComplete={() => { setIsOnboarded(true); }}
      />
    );
  }

  return (
    <RealtimeProvider>
      <SandboxTradingTerminal
        userId={user.sub}
        userName={user.name}
        userEmail={user.email}
        collegeName={userCollege}
      />
    </RealtimeProvider>
  );
}
