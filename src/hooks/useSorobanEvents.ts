import { useEffect, useCallback } from 'react';
import { getSorobanEventStream } from '@/utils/sorobanEventStream';
import type { ParsedSorobanEvent } from '@/utils/parseEvents';

type UseSorobanEventsOptions = {
  contractId?: string | null;
  onEvent?: (event: ParsedSorobanEvent) => void;
  onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
};

export function useSorobanEvents(options: UseSorobanEventsOptions = {}) {
  const { contractId, onEvent, onStatusChange } = options;

  useEffect(() => {
    const stream = getSorobanEventStream();
    let unsubscribeEvent: (() => void) | undefined;
    let unsubscribeStatus: (() => void) | undefined;

    if (contractId && onEvent) {
      unsubscribeEvent = stream.subscribe(contractId, onEvent);
    }

    if (onStatusChange) {
      unsubscribeStatus = stream.onStatusChange(onStatusChange);
    }

    return () => {
      unsubscribeEvent?.();
      unsubscribeStatus?.();
    };
  }, [contractId, onEvent, onStatusChange]);

  const simulateEvent = useCallback((rawEvent: any) => {
    const stream = getSorobanEventStream();
    stream.simulateEvent(rawEvent);
  }, []);

  return { simulateEvent };
}
