import React from 'react';
import { UsageStats } from '@/lib/supabase-types';

interface UsageIndicatorProps {
  usage: UsageStats;
  type: 'daily' | 'monthly';
  size?: number;
  className?: string;
}

function UsageIndicator({ usage, type, size = 120, className = '' }: UsageIndicatorProps) {
  const used = type === 'daily' ? usage.dailyUsed : usage.monthlyUsed;
  const limit = type === 'daily' ? usage.dailyLimit : usage.monthlyLimit;
  const isUnlimited = limit === -1 || usage.isUnlimited;
  
  // Calculate percentage for limited users
  const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
  
  // SVG circle properties
  const center = size / 2;
  const radius = center - 8; // Leave space for stroke
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = isUnlimited ? 0 : circumference - (percentage / 100) * circumference;

  // Colors
  const greenColor = '#10B981'; // Green for remaining/unlimited
  const redColor = '#EF4444';   // Red for used
  const grayColor = '#E5E7EB';  // Gray for background

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={grayColor}
          strokeWidth="8"
        />
        
        {isUnlimited ? (
          // Full green circle for unlimited users
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={greenColor}
            strokeWidth="8"
          />
        ) : (
          <>
            {/* Used portion (red) */}
            {used > 0 && (
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={redColor}
                strokeWidth="8"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={circumference - (percentage / 100) * circumference}
                strokeLinecap="round"
                className="transition-all duration-500 ease-in-out"
              />
            )}
            
            {/* Remaining portion (green) */}
            {used < limit && (
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={greenColor}
                strokeWidth="8"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-in-out"
              />
            )}
          </>
        )}
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {isUnlimited ? (
          <>
            <div className="text-2xl font-bold text-green-600">∞</div>
            {used > 0 && (
              <div className="text-xs text-gray-500 mt-1">{used} used</div>
            )}
          </>
        ) : (
          <>
            <div className="text-lg font-bold text-gray-900">
              {limit - used}
            </div>
            <div className="text-xs text-gray-500">remaining</div>
          </>
        )}
      </div>
      
      {/* Legend for unlimited users with usage */}
      {isUnlimited && used > 0 && (
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
          <div className="text-xs text-gray-500 text-center">
            {used} {type} generations
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for smaller spaces
export function CompactUsageIndicator({ usage, type, className = '' }: Omit<UsageIndicatorProps, 'size'>) {
  const used = type === 'daily' ? usage.dailyUsed : usage.monthlyUsed;
  const limit = type === 'daily' ? usage.dailyLimit : usage.monthlyLimit;
  const isUnlimited = limit === -1 || usage.isUnlimited;
  
  if (isUnlimited) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
          <span className="text-xs text-white font-bold">∞</span>
        </div>
        <span className="text-sm text-gray-600">
          {used > 0 ? `${used} used` : 'Unlimited'}
        </span>
      </div>
    );
  }

  const percentage = Math.min((used / limit) * 100, 100);
  
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Mini progress bar */}
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-green-500 to-red-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm text-gray-600 whitespace-nowrap">
        {limit - used} left
      </span>
    </div>
  );
}

// Usage stats card component
interface UsageStatsCardProps {
  usage: UsageStats;
  className?: string;
}

export function UsageStatsCard({ usage, className = '' }: UsageStatsCardProps) {
  return (
    <div className={`bg-white rounded-lg border p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Overview</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Usage */}
        <div className="text-center">
          <div className="mb-2">
            <UsageIndicator usage={usage} type="daily" size={100} />
          </div>
          <h4 className="font-medium text-gray-700">Daily Limit</h4>
          <p className="text-sm text-gray-500">
            {usage.dailyLimit === -1 ? 'Unlimited' : `${usage.dailyUsed} / ${usage.dailyLimit}`}
          </p>
        </div>
        
        {/* Monthly Usage */}
        <div className="text-center">
          <div className="mb-2">
            <UsageIndicator usage={usage} type="monthly" size={100} />
          </div>
          <h4 className="font-medium text-gray-700">Monthly Limit</h4>
          <p className="text-sm text-gray-500">
            {usage.monthlyLimit === -1 ? 'Unlimited' : `${usage.monthlyUsed} / ${usage.monthlyLimit}`}
          </p>
        </div>
      </div>
      
      {/* Device Usage */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Active Devices</span>
          <span className="text-sm text-gray-500">
            {usage.deviceCount} / {usage.deviceLimit === -1 ? '∞' : usage.deviceLimit}
          </span>
        </div>
        <div className="mt-2 bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              usage.deviceLimit === -1 
                ? 'bg-green-500 w-full' 
                : usage.deviceCount >= usage.deviceLimit 
                  ? 'bg-red-500' 
                  : 'bg-green-500'
            }`}
            style={{ 
              width: usage.deviceLimit === -1 ? '100%' : `${Math.min((usage.deviceCount / usage.deviceLimit) * 100, 100)}%` 
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Named export for UsageIndicator
export { UsageIndicator };

// Default export for backward compatibility
export default UsageIndicator;
