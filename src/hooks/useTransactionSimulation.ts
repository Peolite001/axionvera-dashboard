import { useCallback, useState } from "react";
import { createAxionveraVaultSdk, formatAmount } from "@/utils/contractHelpers";
import { NETWORK } from "@/utils/networkConfig";

export type SimulationResult = {
  type: "deposit" | "withdraw";
  amount: string;
  currentBalance: string;
  projectedBalance: string;
  projectedRewards: string;
  estimatedFee: string;
  netChange: string;
};

type SimulationState = {
  status: "idle" | "loading" | "ready" | "error";
  result: SimulationResult | null;
  error: string | null;
};

const INITIAL_STATE: SimulationState = {
  status: "idle",
  result: null,
  error: null,
};

const ESTIMATED_NETWORK_FEE = "0.00001";
const DEPOSIT_REWARD_RATE = 0.01;

export function useTransactionSimulation(walletAddress: string | null) {
  const [state, setState] = useState<SimulationState>(INITIAL_STATE);
  const sdk = createAxionveraVaultSdk();

  const simulate = useCallback(
    async (type: "deposit" | "withdraw", amountInput: string) => {
      if (!walletAddress) {
        setState({ status: "error", result: null, error: "Wallet not connected." });
        return;
      }

      const amount = parseFloat(amountInput);
      if (!Number.isFinite(amount) || amount <= 0) {
        setState({ status: "error", result: null, error: "Enter a valid amount." });
        return;
      }

      setState({ status: "loading", result: null, error: null });

      try {
        const balances = await sdk.getBalances({ walletAddress, network: NETWORK });
        const currentBalance = parseFloat(balances.balance);
        const currentRewards = parseFloat(balances.rewards);

        let projectedBalance: number;
        let projectedRewards: number;
        let netChange: number;

        if (type === "deposit") {
          projectedBalance = currentBalance + amount;
          projectedRewards = currentRewards + amount * DEPOSIT_REWARD_RATE;
          netChange = amount;
        } else {
          if (amount > currentBalance) {
            setState({
              status: "error",
              result: null,
              error: `Insufficient balance. Available: ${formatAmount(balances.balance)} XLM`,
            });
            return;
          }
          projectedBalance = Math.max(0, currentBalance - amount);
          projectedRewards = currentRewards;
          netChange = -amount;
        }

        setState({
          status: "ready",
          error: null,
          result: {
            type,
            amount: amountInput,
            currentBalance: balances.balance,
            projectedBalance: projectedBalance.toString(),
            projectedRewards: projectedRewards.toString(),
            estimatedFee: ESTIMATED_NETWORK_FEE,
            netChange: netChange.toString(),
          },
        });
      } catch (err) {
        setState({
          status: "error",
          result: null,
          error: err instanceof Error ? err.message : "Simulation failed.",
        });
      }
    },
    [walletAddress, sdk]
  );

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  return {
    simulationStatus: state.status,
    simulationResult: state.result,
    simulationError: state.error,
    simulate,
    resetSimulation: reset,
  };
}
