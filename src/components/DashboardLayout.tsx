import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useUserStore } from '../store/userStore';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { identifyUser } from '../lib/posthog';

export const DashboardLayout = () => {
  const { user, setUser, setUserData, isLoading, setIsLoading } = useUserStore();
  const navigate = useNavigate();

  useEffect(() => {
    // If we have a dummy API key, bypass auth for UI preview
    if (!isFirebaseConfigured) {
      setUser({ uid: 'dummy-user', email: 'demo@example.com' } as any);
      setUserData({
        display_name: 'Demo User',
        subscription_tier: 'Pro',
        credits_balance: 1500
      });
      setIsLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        identifyUser(currentUser.uid, currentUser.email || '');
        
        // Listen to user document
        const userDocRef = doc(db, 'users', currentUser.uid);
        const unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
        });
        
        setIsLoading(false);
        return () => unsubscribeDoc();
      } else {
        setUserData(null);
        setIsLoading(false);
        navigate('/login');
      }
    });

    return () => unsubscribeAuth();
  }, [setUser, setUserData, setIsLoading, navigate]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">Loading...</div>;
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
};
