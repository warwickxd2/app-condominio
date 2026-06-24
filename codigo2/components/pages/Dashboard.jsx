import React from 'react';
import { useProfile } from '@/lib/ProfileContext';
import MoradorHome from '@/components/dashboard/MoradorHome';
import AdminDashboard from '@/components/dashboard/AdminDashboard';

export default function Dashboard() {
  const { activeProfile } = useProfile();
  return activeProfile === 'admin' ? <AdminDashboard /> : <MoradorHome />;
}