'use client';

import React, { useState, useEffect } from 'react';

interface AttentionGaugeProps {
  score: number;
  confidence: number;
  className?: string;
}

const AttentionGauge = ({ score, confidence, className = '' }: AttentionGaugeProps) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const interval = setInterval(() => {
      setAnimatedScore(prev => {
        const diff = score - prev;
        if (Math.abs(diff) < 0.1) return score;
        return prev + diff * 0.1;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [score, isHydrated]);

  const getScoreColor = (currentScore: number): string => {
    if (currentScore >= 80) return '#10B981'; // success
    if (currentScore >= 60) return '#F59E0B'; // warning
    return '#EF4444'; // error
  };

  const getScoreLabel = (currentScore: number): string => {
    if (currentScore >= 80) return 'Excellent';
    if (currentScore >= 60) return 'Good';
    if (currentScore >= 40) return 'Fair';
    return 'Poor';
  };

  const circumference = 2 * Math.PI * 90;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  if (!isHydrated) {
    return (
      <div className={`flex flex-col items-center justify-center p-6 bg-card rounded-lg border border-border ${className}`}>
        <div className="w-48 h-48 rounded-full bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center p-6 bg-card rounded-lg border border-border ${className}`}>
      <div className="relative w-48 h-48">
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r="90"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="8"
            fill="transparent"
          />
          
          {/* Progress Circle */}
          <circle
            cx="100"
            cy="100"
            r="90"
            stroke={getScoreColor(animatedScore)}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-out"
            style={{
              filter: `drop-shadow(0 0 8px ${getScoreColor(animatedScore)}40)`,
            }}
          />
          
          {/* Confidence Band */}
          <circle
            cx="100"
            cy="100"
            r="75"
            stroke={getScoreColor(animatedScore)}
            strokeWidth="2"
            fill="transparent"
            strokeDasharray={`${confidence * 4.7} 10`}
            opacity="0.3"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-foreground mb-1">
            {Math.round(animatedScore)}
          </div>
          <div className="text-sm text-muted-foreground mb-2">
            Attention Score
          </div>
          <div 
            className="text-xs font-medium px-2 py-1 rounded-full"
            style={{ 
              color: getScoreColor(animatedScore),
              backgroundColor: `${getScoreColor(animatedScore)}20`
            }}
          >
            {getScoreLabel(animatedScore)}
          </div>
        </div>
      </div>

      {/* Confidence Indicator */}
      <div className="mt-4 w-full">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>Confidence</span>
          <span>{Math.round(confidence)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-1">
          <div 
            className="h-1 rounded-full transition-all duration-300"
            style={{ 
              width: `${confidence}%`,
              backgroundColor: getScoreColor(animatedScore)
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AttentionGauge;