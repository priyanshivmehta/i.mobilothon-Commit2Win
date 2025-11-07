'use client';

import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

export default function UserTypes() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Built for Everyone
          </h2>
          <p className="text-xl text-gray-600">
            Whether you're an individual driver or managing a fleet
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* For Drivers */}
          <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-gray-200 hover:border-blue-500 transition-all">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mb-6">
              <Icon name="UserIcon" size={32} className="text-blue-600" />
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              For Drivers
            </h3>
            
            <p className="text-gray-600 mb-6">
              Personal Safety Assistant
            </p>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <Icon name="CheckCircleIcon" size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Stay alert on long drives</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="CheckCircleIcon" size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Privacy-protected monitoring</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="CheckCircleIcon" size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Personalized fatigue insights</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="CheckCircleIcon" size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Free for individual use</span>
              </li>
            </ul>

            <Link
              href="/auth/driver/signup"
              className="block w-full text-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              Try Driver Monitor
            </Link>
          </div>

          {/* For Fleet Managers */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 shadow-xl border-2 border-transparent hover:scale-105 transition-all text-white">
            <div className="flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-lg mb-6">
              <Icon name="UserGroupIcon" size={32} className="text-white" />
            </div>

            <h3 className="text-2xl font-bold mb-3">
              For Fleet Managers
            </h3>
            
            <p className="text-blue-100 mb-6">
              Enterprise Fleet Control
            </p>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <Icon name="CheckCircleIcon" size={20} className="text-green-300 flex-shrink-0 mt-0.5" />
                <span>Monitor 100s of drivers in real-time</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="CheckCircleIcon" size={20} className="text-green-300 flex-shrink-0 mt-0.5" />
                <span>Identify high-risk routes</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="CheckCircleIcon" size={20} className="text-green-300 flex-shrink-0 mt-0.5" />
                <span>Reduce accident rates by 40%</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="CheckCircleIcon" size={20} className="text-green-300 flex-shrink-0 mt-0.5" />
                <span>Compliance reporting</span>
              </li>
            </ul>

            <Link
              href="/auth/fleet/signup"
              className="block w-full text-center px-6 py-3 bg-white text-blue-600 hover:bg-gray-100 font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              Request Demo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
