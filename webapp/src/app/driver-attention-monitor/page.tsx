import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import DriverMonitorInteractive from './components/DriverMonitorInteractive';

export const metadata: Metadata = {
  title: 'Driver Attention Monitor - VW Driver Attention Platform',
  description: 'Real-time driver attention assessment using on-device face mesh analysis with privacy-first monitoring for Volkswagen commercial drivers.',
};

export default function DriverAttentionMonitorPage() {
  return (
    <>
      <Header />
      <DriverMonitorInteractive />
    </>
  );
}