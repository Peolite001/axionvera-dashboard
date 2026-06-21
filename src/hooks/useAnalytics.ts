import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createAxionveraVaultSdk,
  type AxionveraVaultSdk,
  type AnalyticsData
} from "@/utils/contractHelpers";
import { NETWORK } from "@/utils/networkConfig";

type UseAnalyticsArgs = {
  walletAddress: string | null;
  sdk?: AxionveraVaultSdk;
};

type UseAnalyticsState = {
  data: AnalyticsData | null;
  isLoading: boolean;
  error: string | null;
};

const initialState: UseAnalyticsState = {
  data: null,
  isLoading: false,
  error: null
};

export function useAnalytics({ walletAddress, sdk: providedSdk }: UseAnalyticsArgs) {
  const sdk = useMemo(() => providedSdk ?? createAxionveraVaultSdk(), [providedSdk]);
  const [state, setState] = useState<UseAnalyticsState>(initialState);

  const refresh = useCallback(async () => {
    if (!walletAddress) {
      setState(initialState);
      return;
    }

    setState({ data: null, isLoading: true, error: null });
    try {
      const data = await sdk.getAnalytics({ walletAddress, network: NETWORK });
      setState({ data, isLoading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load analytics data";
      setState({ data: null, isLoading: false, error: message });
    }
  }, [sdk, walletAddress]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    ...state,
    refresh
  };
}
