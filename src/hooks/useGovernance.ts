import { useCallback, useEffect, useMemo, useState } from "react";
import { notify } from "@/utils/notifications";
import {
  createAxionveraGovernanceSdk,
  type AxionveraGovernanceSdk,
  type Proposal,
  type Vote,
  type VoteChoice,
  type GovernanceStats,
  type GovernanceParams,
} from "@/utils/contractHelpersGovernance";
import { NETWORK } from "@/utils/networkConfig";

type UseGovernanceArgs = {
  walletAddress: string | null;
  sdk?: AxionveraGovernanceSdk;
};

type GovernanceActionType = "vote" | "createProposal";

type GovernanceActionState = {
  status: "idle" | "pending" | "success" | "error";
  hash: string | null;
  error: string | null;
};

type GovernanceState = {
  proposals: Proposal[];
  selectedProposal: Proposal | null;
  votes: Vote[];
  userVotes: Vote[];
  stats: GovernanceStats | null;
  params: GovernanceParams | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  actions: Record<GovernanceActionType, GovernanceActionState>;
};

const INITIAL_ACTION: GovernanceActionState = { status: "idle", hash: null, error: null };
const INITIAL_STATE: GovernanceState = {
  proposals: [],
  selectedProposal: null,
  votes: [],
  userVotes: [],
  stats: null,
  params: null,
  isLoading: false,
  isSubmitting: false,
  error: null,
  actions: { vote: { ...INITIAL_ACTION }, createProposal: { ...INITIAL_ACTION } },
};

function getError(e: unknown, fallback: string) {
  return e instanceof Error ? e.message : fallback;
}

function updateAction(
  state: GovernanceState,
  type: GovernanceActionType,
  patch: Partial<GovernanceActionState>
): GovernanceState {
  return { ...state, actions: { ...state.actions, [type]: { ...state.actions[type], ...patch } } };
}

export function useGovernance({ walletAddress, sdk: providedSdk }: UseGovernanceArgs) {
  const sdk = useMemo(() => providedSdk ?? createAxionveraGovernanceSdk(), [providedSdk]);
  const [state, setState] = useState<GovernanceState>(INITIAL_STATE);

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const [proposals, stats, params] = await Promise.all([
        sdk.getProposals({ network: NETWORK }),
        sdk.getGovernanceStats({ network: NETWORK }),
        sdk.getGovernanceParams({ network: NETWORK }),
      ]);
      setState((s) => ({ ...s, proposals, stats, params, isLoading: false }));
    } catch (e) {
      const message = getError(e, "Failed to load governance state.");
      notify.error("Governance Update Failed", message);
      setState((s) => ({ ...s, isLoading: false, error: message }));
    }
  }, [sdk]);

  const refreshProposal = useCallback(async (proposalId: string) => {
    try {
      const [proposal, votes, userVotes] = await Promise.all([
        sdk.getProposal({ proposalId, network: NETWORK }),
        sdk.getVotes({ proposalId, network: NETWORK }),
        walletAddress
          ? sdk.getUserVotes({ walletAddress, network: NETWORK })
          : Promise.resolve([]),
      ]);
      setState((s) => ({
        ...s,
        selectedProposal: proposal,
        votes: votes,
        userVotes: userVotes,
      }));
    } catch (e) {
      const message = getError(e, "Failed to load proposal details.");
      notify.error("Proposal Load Failed", message);
    }
  }, [sdk, walletAddress]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const vote = useCallback(
    async (proposalId: string, choice: VoteChoice) => {
      if (!walletAddress) {
        setState((s) =>
          updateAction(s, "vote", { status: "error", error: "Connect a wallet to vote.", hash: null })
        );
        return;
      }

      setState((s) => ({
        ...updateAction(s, "vote", { status: "pending", hash: null, error: null }),
        isSubmitting: true,
        error: null,
      }));

      try {
        const result = await sdk.vote({
          walletAddress,
          proposalId,
          choice,
          network: NETWORK,
        });
        await refresh();
        await refreshProposal(proposalId);
        setState((s) =>
          updateAction(s, "vote", { status: "success", hash: result.hash, error: null })
        );
        notify.success("Vote Cast", `Transaction hash: ${result.hash}`);
      } catch (e) {
        const message = getError(e, "Vote failed.");
        notify.error("Vote Failed", message);
        setState((s) =>
          updateAction(s, "vote", { status: "error", hash: null, error: message })
        );
      } finally {
        setState((s) => ({ ...s, isSubmitting: false }));
      }
    },
    [sdk, walletAddress, refresh, refreshProposal]
  );

  const createProposal = useCallback(
    async (title: string, description: string) => {
      if (!walletAddress) {
        setState((s) =>
          updateAction(s, "createProposal", {
            status: "error",
            error: "Connect a wallet to create a proposal.",
            hash: null,
          })
        );
        return;
      }
      if (!title.trim() || !description.trim()) {
        setState((s) =>
          updateAction(s, "createProposal", {
            status: "error",
            error: "Title and description are required.",
            hash: null,
          })
        );
        return;
      }

      setState((s) => ({
        ...updateAction(s, "createProposal", { status: "pending", hash: null, error: null }),
        isSubmitting: true,
        error: null,
      }));

      try {
        const result = await sdk.createProposal({
          walletAddress,
          title: title.trim(),
          description: description.trim(),
          actions: [{ type: "custom", target: "governance", value: "0", data: "proposal_action" }],
          network: NETWORK,
        });
        await refresh();
        setState((s) =>
          updateAction(s, "createProposal", { status: "success", hash: result.hash, error: null })
        );
        notify.success("Proposal Created", `Proposal ID: ${result.proposalId}`);
      } catch (e) {
        const message = getError(e, "Failed to create proposal.");
        notify.error("Proposal Creation Failed", message);
        setState((s) =>
          updateAction(s, "createProposal", { status: "error", hash: null, error: message })
        );
      } finally {
        setState((s) => ({ ...s, isSubmitting: false }));
      }
    },
    [sdk, walletAddress, refresh]
  );

  const selectProposal = useCallback(
    (proposal: Proposal | null) => {
      setState((s) => ({ ...s, selectedProposal: proposal, votes: [], userVotes: [] }));
      if (proposal) {
        void refreshProposal(proposal.id);
      }
    },
    [refreshProposal]
  );

  return {
    proposals: state.proposals,
    selectedProposal: state.selectedProposal,
    votes: state.votes,
    userVotes: state.userVotes,
    stats: state.stats,
    params: state.params,
    isLoading: state.isLoading,
    isSubmitting: state.isSubmitting,
    error: state.error,
    voteStatus: state.actions.vote.status,
    voteHash: state.actions.vote.hash,
    voteError: state.actions.vote.error,
    createProposalStatus: state.actions.createProposal.status,
    createProposalHash: state.actions.createProposal.hash,
    createProposalError: state.actions.createProposal.error,
    refresh,
    refreshProposal,
    vote,
    createProposal,
    selectProposal,
  };
}