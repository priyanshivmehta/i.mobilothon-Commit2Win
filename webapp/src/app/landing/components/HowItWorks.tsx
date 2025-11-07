'use client';

import Icon from '@/components/ui/AppIcon';

export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      icon: 'DevicePhoneMobileIcon',
      title: 'Connect',
      description: 'Mount your phone, grant camera access',
      detail: 'Works with any smartphone - iOS or Android'
    },
    {
      number: '02',
      icon: 'EyeIcon',
      title: 'Drive Safely',
      description: 'AI monitors attention levels in real-time',
      detail: 'Get instant alerts when fatigue is detected'
    },
    {
      number: '03',
      icon: 'ChartBarIcon',
      title: 'Review Insights',
      description: 'Post-trip analytics and wellness trends',
      detail: 'Fleet managers see aggregated risk heatmaps'
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600">
            Get started in three simple steps
          </p>
        </div>

        <div className="relative">
          {/* Connection line */}
          <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-blue-500 to-blue-200"></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {steps.map((step, index) => (
              <div key={index} className="text-center relative">
                {/* Step number badge */}
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 text-white text-2xl font-bold rounded-full mb-6 shadow-lg relative z-10">
                  {step.number}
                </div>

                {/* Icon */}
                <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mx-auto mb-4">
                  <Icon name={step.icon} size={32} className="text-blue-600" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {step.title}
                </h3>
                
                <p className="text-gray-700 font-medium mb-2">
                  {step.description}
                </p>
                
                <p className="text-gray-500 text-sm">
                  {step.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
