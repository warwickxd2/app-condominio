import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Subscribes to realtime updates on an entity and invalidates
 * the given query key so TanStack Query refetches automatically.
 */
export function useRealtimeSync(entityName, queryKey) {
  const queryClient = useQueryClient();
  useEffect(() => {
    const unsubscribe = base44.entities[entityName].subscribe(() => {
      queryClient.invalidateQueries({ queryKey });
    });
    return () => unsubscribe();
  }, [entityName, queryKey]);
}