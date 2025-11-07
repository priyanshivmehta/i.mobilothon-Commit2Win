import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Header from '@/components/common/Header';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// Import DriverMonitorInteractive with no SSR to avoid window undefined errors
const DriverMonitorInteractive = dynamic(
  () => import('./components/DriverMonitorInteractive'),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'Driver Attention Monitor - VW Driver Attention Platform',
  description: 'Real-time driver attention assessment using on-device face mesh analysis with privacy-first monitoring for Volkswagen commercial drivers.',
};

export default async function DriverAttentionMonitorPage() {
  const supabase = await createClient();
  
  // Get user role
  const { data: { user } } = await supabase.auth.getUser();
  let userRole: 'USER' | 'EMPLOYEE' | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    userRole = profile?.role as 'USER' | 'EMPLOYEE' || null;
  }

  return (
    <>
      <Header userRole={userRole} />
      <DriverMonitorInteractive />
    </>
  );
}