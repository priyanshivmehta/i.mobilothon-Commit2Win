import type { Metadata } from 'next';
import PrivacyConsentInteractive from './components/PrivacyConsentInteractive';

export const metadata: Metadata = {
  title: 'Privacy Consent Setup - VW Driver Attention Platform',
  description: 'Configure your privacy preferences and understand how on-device processing protects your data while enabling real-time attention monitoring.',
};

export default function PrivacyConsentSetupPage() {
  return <PrivacyConsentInteractive />;
}