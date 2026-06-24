import React from 'react';
import { cn } from '@/lib/utils';

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendLabel, className }) {
  return (
    <div className={cn(
      "bg-card rounded-xl border border-border p-5 transition-all hover:shadow-lg hover:shadow-primary/5",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-display font-bold text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1.5 mt-3">
          <span className={cn(
            "text-xs font-semibold px-1.5 py-0.5 rounded",
            trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
          )}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
          {trendLabel && <span className="text-xs text-muted-foreground">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}