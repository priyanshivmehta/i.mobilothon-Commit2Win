import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import FleetConsoleInteractive from './components/FleetConsoleInteractive';

export const metadata: Metadata = {
  title: 'Fleet Management Console - VW Driver Attention Platform',
  description: 'Monitor multiple drivers simultaneously and analyze route risk patterns for operational optimization and safety compliance.',
};

export default function FleetManagementConsolePage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <FleetConsoleInteractive />
    </main>
  );
}