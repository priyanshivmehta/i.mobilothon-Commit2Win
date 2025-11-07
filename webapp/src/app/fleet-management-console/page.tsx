import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Header from '@/components/common/Header';
import { createClient } from '@/lib/supabase/server';

// Import FleetConsoleInteractive with no SSR to avoid window undefined errors
const FleetConsoleInteractive = dynamic(
  () => import('./components/FleetConsoleInteractive'),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'Fleet Management Console - VW Driver Attention Platform',
  description: 'Monitor multiple drivers simultaneously and analyze route risk patterns for operational optimization and safety compliance.',
};

export default async function FleetManagementConsolePage() {
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
    <main className="min-h-screen bg-background">
      <Header userRole={userRole} />
      <FleetConsoleInteractive />
    </main>
  );
}