'use client';

import Icon from '@/components/ui/AppIcon';

export default function SolutionOverview() {
  const features = [
    {
      icon: 'BoltIcon',
      title: 'Real-Time Detection',
      description: 'AI detects drowsiness, distraction, and fatigue in <50ms',
      details: 'Multi-modal fusion: Face + Eyes + Voice + Head Pose'
    },
    {
      icon: 'ShieldCheckIcon',
      title: 'Privacy by Design',
      description: 'On-device processing - video never leaves your phone',
      details: 'GDPR compliant with full user control'
    },
    {
      icon: 'BellAlertIcon',
      title: 'Smart Interventions',
      description: 'Context-aware alerts: Voice at low speed, visual at high speed',
      details: 'Adaptive severity levels based on risk'
    },
    {
      icon: 'MapIcon',
      title: 'Fleet Intelligence',
      description: 'Live tracking of driver wellness across your fleet',
      details: 'Route risk analytics and predictive alerts'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Intelligent, Privacy-First Driver Monitoring
          </h2>
          <p className="text-xl text-gray-600">
            Advanced AI technology that respects your privacy
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-500 group"
            >
              <div className="flex items-center justify-center w-14 h-14 bg-blue-100 group-hover:bg-blue-600 rounded-lg mb-6 transition-colors">
                <Icon name={feature.icon} size={28} className="text-blue-600 group-hover:text-white transition-colors" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              
              <p className="text-gray-700 mb-3 font-medium">
                {feature.description}
              </p>
              
              <p className="text-gray-500 text-sm">
                {feature.details}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
