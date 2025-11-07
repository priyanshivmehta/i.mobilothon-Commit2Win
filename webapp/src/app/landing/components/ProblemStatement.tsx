'use client';

import Icon from '@/components/ui/AppIcon';

export default function ProblemStatement() {
  const problems = [
    {
      icon: 'ClockIcon',
      stat: '$109B',
      title: 'Annual Cost',
      description: 'Fatigue-related accidents cost the economy billions every year'
    },
    {
      icon: 'ExclamationTriangleIcon',
      stat: '15 min',
      title: 'Every 15 Minutes',
      description: 'A drowsy driving accident occurs, causing injury or death'
    },
    {
      icon: 'EyeSlashIcon',
      stat: '4 sec',
      title: 'Micro-Sleep',
      description: 'Traditional systems fail to detect critical micro-sleep episodes'
    }
  ];

  return (
    <section className="py-20 bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Every 15 Minutes, Drowsy Driving Causes an Accident
          </h2>
          <p className="text-xl text-gray-400">
            Traditional monitoring systems aren't enough
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {problems.map((problem, index) => (
            <div 
              key={index}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 hover:border-red-500/50 transition-all duration-300 hover:transform hover:scale-105"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-lg mb-6">
                <Icon name={problem.icon} size={32} className="text-red-400" />
              </div>
              
              <div className="text-4xl font-bold text-red-400 mb-2">
                {problem.stat}
              </div>
              
              <div className="text-xl font-semibold mb-3">
                {problem.title}
              </div>
              
              <p className="text-gray-400">
                {problem.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
