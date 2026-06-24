import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EmptyState({ icon: Icon = Inbox, title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-cyan-400" />
      </div>
      <h3 className="font-display font-semibold text-white mb-1">{title}</h3>
      {description && <p className="text-sm text-white/50 max-w-sm">{description}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}