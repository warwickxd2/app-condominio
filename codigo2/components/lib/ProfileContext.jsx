import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const { user } = useAuth();
  const [activeProfile, setActiveProfile] = useState(() => {
    return localStorage.getItem('condogest_profile') || 'morador';
  });

  const isAdmin = user?.role === 'admin';
  const canSwitch = isAdmin;

  useEffect(() => {
    if (!isAdmin && activeProfile === 'admin') {
      setActiveProfile('morador');
      localStorage.setItem('condogest_profile', 'morador');
    }
  }, [isAdmin, activeProfile]);

  const switchProfile = (profile) => {
    if (profile === 'admin' && !isAdmin) return;
    setActiveProfile(profile);
    localStorage.setItem('condogest_profile', profile);
  };

  return (
    <ProfileContext.Provider value={{ activeProfile, switchProfile, canSwitch, isAdmin }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used within a ProfileProvider');
  return context;
};