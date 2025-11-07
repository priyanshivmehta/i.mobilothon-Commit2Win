'use client';

import Link from 'next/link';

export default function FinalCTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Ready to Drive Safer?
        </h2>
        
        <p className="text-xl text-blue-100 mb-10">
          Join thousands of drivers monitoring their attention in real-time
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/driver/signup"
            className="px-8 py-4 bg-white text-blue-600 hover:bg-gray-100 font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Get Started Free
          </Link>
          <Link
            href="/auth/fleet/signup"
            className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all backdrop-blur-sm border-2 border-white/30"
          >
            Book Fleet Demo
          </Link>
        </div>

        <p className="text-sm text-blue-200 mt-8">
          No credit card required · 5 minute setup · Cancel anytime
        </p>
      </div>
    </section>
  );
}
