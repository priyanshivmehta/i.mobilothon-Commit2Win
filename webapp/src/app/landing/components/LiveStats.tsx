'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LiveStats() {
  const [activeDrivers, setActiveDrivers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient();
      
      try {
        // Get count of USER role profiles
        const { count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'USER');

        if (!error && count !== null) {
          setActiveDrivers(count);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const stats = [
    {
      value: loading ? '...' : activeDrivers.toString(),
      label: 'Active Drivers Now',
      live: true
    },
    {
      value: '1,247',
      label: 'Alerts Prevented Today',
      live: false
    },
    {
      value: '94.2%',
      label: 'Average Attention Score',
      live: false
    },
    {
      value: '50+',
      label: 'Routes Monitored',
      live: false
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Trusted by Drivers Worldwide
          </h2>
          <p className="text-xl text-gray-600">
            Real-time statistics from our platform
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="text-center p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 hover:border-blue-500 transition-all hover:shadow-lg"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                {stat.live && (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                )}
                <div className="text-4xl md:text-5xl font-bold text-blue-600">
                  {stat.value}
                </div>
              </div>
              <div className="text-sm text-gray-600 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
