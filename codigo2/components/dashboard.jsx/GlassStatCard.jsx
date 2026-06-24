import React from 'react';
import { cn } from '@/lib/utils';

const accentColors = {
  cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-400/20',
  blue: 'text-blue-400 bg-blue-500/10 border-blue-400/20',
  emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-400/20',
  amber: 'text-amber-400 bg-amber-500/10 border-amber-400/20',
  purple: 'text-purple-400 bg-purple-500/10 border-purple-400/20',
  red: 'text-red-400 bg-red-500/10 border-red-400/20',
};

export default function GlassStatCard({ title, value, icon: Icon, subtitle, accent = 'cyan' }) {
  return (
    <div className="glass-card glass-hover p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", accentColors[accent])}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
      </div>
      <p className="text-2xl font-bold font-display text-white">{value}</p>
      <p className="text-sm text-white/60 mt-1">{title}</p>
      {subtitle && <p className="text-xs text-white/40 mt-1">{subtitle}</p>}
    </div>
  );
}
