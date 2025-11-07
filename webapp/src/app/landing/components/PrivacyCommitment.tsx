'use client';

import Icon from '@/components/ui/AppIcon';

export default function PrivacyCommitment() {
  const privacyPillars = [
    {
      icon: 'LockClosedIcon',
      title: 'On-Device Processing',
      description: 'Video processed locally, never uploaded to servers'
    },
    {
      icon: 'TrashIcon',
      title: 'Auto-Delete',
      description: 'Data deleted after 24 hours automatically'
    },
    {
      icon: 'UserIcon',
      title: 'Full Control',
      description: 'Camera access can be revoked anytime'
    },
    {
      icon: 'DocumentCheckIcon',
      title: 'Transparent',
      description: 'Open-source AI models, auditable code'
    }
  ];

  const certifications = [
    'GDPR Compliant',
    'ISO 27001',
    'Privacy Shield'
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Your Privacy is Non-Negotiable
          </h2>
          <p className="text-xl text-gray-600">
            Built with privacy and security at the core
          </p>
        </div>

        {/* Privacy Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {privacyPillars.map((pillar, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border border-green-200"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
                <Icon name={pillar.icon} size={24} className="text-green-600" />
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {pillar.title}
              </h3>
              
              <p className="text-gray-600 text-sm">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>

        {/* Certifications */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 text-center mb-6">
            Certified & Compliant
          </h3>
          
          <div className="flex flex-wrap items-center justify-center gap-8">
            {certifications.map((cert, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 px-6 py-3 bg-green-50 rounded-lg border border-green-200"
              >
                <Icon name="ShieldCheckIcon" size={20} className="text-green-600" />
                <span className="font-semibold text-gray-700">{cert}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
