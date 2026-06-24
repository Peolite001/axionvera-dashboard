import { useCallback, useEffect, useRef, useState } from "react";

import {
  DEFAULT_PROTOCOL_HEALTH_POLL_MS,
  getProtocolHealthSnapshot,
  type ProtocolHealthSnapshot,
} from "@/services/protocolHealth";

type ProtocolHealthState = {
  snapshot: ProtocolHealthSnapshot | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useProtocolHealth(pollIntervalMs = DEFAULT_PROTOCOL_HEALTH_POLL_MS): ProtocolHealthState {
  const [snapshot, setSnapshot] = useState<ProtocolHealthSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const nextSnapshot = await getProtocolHealthSnapshot();
      if (isMounted.current) {
        setSnapshot(nextSnapshot);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : "Failed to load protocol health.");
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    void refresh();

    const interval = window.setInterval(() => {
      void refresh();
    }, pollIntervalMs);

    return () => {
      isMounted.current = false;
      window.clearInterval(interval);
    };
  }, [pollIntervalMs, refresh]);

  return { snapshot, isLoading, error, refresh };
}
