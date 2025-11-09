'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-[#026f83] to-slate-900 overflow-hidden">
      {/* 🔹 Brand Logo & Title (top-left corner) */}
      <div className="absolute top-6 left-6 flex items-center space-x-3 z-20">
        <img
          src="/icons-removebg-preview.png"
          alt="OptiDrive Logo"
          className="w-8 h-8 object-contain drop-shadow-lg"
        />
        <h1
          className=" font-semibold text-white tracking-wide"
          style={{
            fontFamily: "'Rubik', 'Poppins', sans-serif",
            letterSpacing: '0.5px',
          }}
        >
          OptiDrive
        </h1>
      </div>

      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#026f83] rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left side - Content */}
        <div
          className={`space-y-8 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
          }`}
        >
          <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
            AI-Powered Driver Safety for the Modern Fleet
          </h1>

          <p className="text-xl text-gray-300 leading-relaxed">
            Real-time attention monitoring with privacy-first design.
            Detect drowsiness and distraction before accidents happen.
          </p>

          {/* CTA Buttons */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/auth/driver/signup"
                className="px-8 py-4 bg-[#026f83] text-white hover:bg-white hover:text-[#026f83] font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 text-center"
              >
                Get Started as Driver
              </Link>
              <Link
                href="/auth/fleet/signup"
                className="px-8 py-4 bg-[#026f83] text-white hover:bg-white hover:text-[#026f83] font-semibold rounded-lg transition-all backdrop-blur-sm border border-white/20 text-center"
              >
                Fleet Management
              </Link>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-300">
              Already have an account?
              <Link
                href="/auth/signin"
                className="text-[#026f83] hover:text-blue-300 font-semibold underline"
              >
                Sign In Here
              </Link>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex items-center gap-6 pt-6 border-t border-white/10">
            <div className="text-sm text-gray-400">
              Powered by{' '}
              <span className="text-white font-semibold">Volkswagen</span>
            </div>
            <div className="w-px h-6 bg-white/20"></div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Icon name="ShieldCheckIcon" size={16} className="text-green-400" />
              Privacy Certified
            </div>
          </div>

          {/* Floating stats */}
          <div className="grid grid-cols-3 gap-4 pt-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">98%</div>
              <div className="text-sm text-gray-400">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">&lt;50ms</div>
              <div className="text-sm text-gray-400">Latency</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">100%</div>
              <div className="text-sm text-gray-400">Private</div>
            </div>
          </div>
        </div>

        {/* Right side - Visual */}
        <div
          className={`relative transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
          }`}
        >
          <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl">
            {/* Mock dashboard preview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-white font-semibold">Driver Monitor</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-300">Active</span>
                </div>
              </div>

              <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center border border-white/10">
                <Icon name="EyeIcon" size={64} className="text-white/40" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="text-sm text-gray-400">Attention Score</div>
                  <div className="text-2xl font-bold text-white mt-1">95</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="text-sm text-gray-400">Risk Level</div>
                  <div className="text-2xl font-bold text-green-400 mt-1">
                    Low
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating elements */}
          <div className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
            Real-time AI
          </div>
          <div className="absolute -bottom-4 -left-4 bg-[#026f83] text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
            Privacy First
          </div>
        </div>
      </div>
    </section>
  );
}
