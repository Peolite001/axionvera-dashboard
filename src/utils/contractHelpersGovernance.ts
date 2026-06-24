import type { StellarNetwork } from "@/utils/networkConfig";
import { withApiResilience, withErrorHandling } from "@/utils/apiResilience";
import type { ApiCallOptions } from "@/utils/apiResilience";

export type ProposalStatus = "active" | "passed" | "rejected" | "executed" | "cancelled";
export type VoteChoice = "for" | "against" | "abstain";

export type Proposal = {
  id: string;
  title: string;
  description: string;
  proposer: string;
  status: ProposalStatus;
  createdAt: string;
  endsAt: string;
  executedAt: string | null;
  votesFor: string;
  votesAgainst: string;
  votesAbstain: string;
  quorum: string;
  threshold: string;
  actions: ProposalAction[];
  metadataUri: string | null;
};

export type ProposalAction = {
  type: "transfer" | "upgrade" | "parameter_change" | "custom";
  target: string;
  value: string;
  data: string;
};

export type Vote = {
  proposalId: string;
  voter: string;
  choice: VoteChoice;
  weight: string;
  timestamp: string;
};

export type GovernanceStats = {
  totalProposals: number;
  activeProposals: number;
  totalVotesCast: number;
  participationRate: string;
  averageQuorum: string;
};

export type GovernanceParams = {
  votingDelay: number;
  votingPeriod: number;
  quorumNumerator: number;
  quorumDenominator: number;
  proposalThreshold: string;
};

export type AxionveraGovernanceSdk = {
  getProposals: (args: { network: StellarNetwork }, options?: ApiCallOptions) => Promise<Proposal[]>;
  getProposal: (args: { proposalId: string; network: StellarNetwork }, options?: ApiCallOptions) => Promise<Proposal | null>;
  getVotes: (args: { proposalId: string; network: StellarNetwork }, options?: ApiCallOptions) => Promise<Vote[]>;
  getUserVotes: (args: { walletAddress: string; network: StellarNetwork }, options?: ApiCallOptions) => Promise<Vote[]>;
  getGovernanceStats: (args: { network: StellarNetwork }, options?: ApiCallOptions) => Promise<GovernanceStats>;
  getGovernanceParams: (args: { network: StellarNetwork }, options?: ApiCallOptions) => Promise<GovernanceParams>;
  vote: (args: { walletAddress: string; proposalId: string; choice: VoteChoice; network: StellarNetwork }, options?: ApiCallOptions) => Promise<{ hash: string }>;
  createProposal: (args: { walletAddress: string; title: string; description: string; actions: ProposalAction[]; network: StellarNetwork }, options?: ApiCallOptions) => Promise<{ hash: string; proposalId: string }>;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getStorageKey(network: StellarNetwork) {
  return `axionvera:governance:${network}`;
}

type StoredGovernance = {
  proposals: Proposal[];
  votes: Record<string, Vote[]>;
  userVotes: Record<string, Vote[]>;
  stats: GovernanceStats;
  params: GovernanceParams;
};

function loadGovernance(network: StellarNetwork): StoredGovernance {
  if (typeof window === "undefined") return createDefaultGovernance();
  const raw = window.localStorage.getItem(getStorageKey(network));
  if (!raw) return createDefaultGovernance();
  try {
    const parsed = JSON.parse(raw) as StoredGovernance;
    return {
      proposals: Array.isArray(parsed.proposals) ? parsed.proposals : [],
      votes: typeof parsed.votes === "object" ? parsed.votes : {},
      userVotes: typeof parsed.userVotes === "object" ? parsed.userVotes : {},
      stats: parsed.stats ?? createDefaultGovernance().stats,
      params: parsed.params ?? createDefaultGovernance().params,
    };
  } catch {
    return createDefaultGovernance();
  }
}

function saveGovernance(network: StellarNetwork, data: StoredGovernance) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getStorageKey(network), JSON.stringify(data));
}

function createDefaultGovernance(): StoredGovernance {
  const now = new Date();
  const proposals: Proposal[] = [
    {
      id: "prop-001",
      title: "Increase Vault Deposit Cap to 500,000 XLM",
      description: "This proposal seeks to increase the maximum deposit cap for the Axionvera Vault from 250,000 XLM to 500,000 XLM. The increase is justified by the growing demand for vault services and the need to accommodate larger institutional deposits. The cap was last reviewed 6 months ago when total TVL was 50,000 XLM. Current TVL has grown to 180,000 XLM, approaching the existing limit.",
      proposer: "GAA...VAULT",
      status: "active",
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      endsAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      executedAt: null,
      votesFor: "125000",
      votesAgainst: "45000",
      votesAbstain: "12000",
      quorum: "200000",
      threshold: "50",
      actions: [
        { type: "parameter_change", target: "vault_contract", value: "500000", data: "deposit_cap" }
      ],
      metadataUri: null,
    },
    {
      id: "prop-002",
      title: "Add USDC as Supported Deposit Asset",
      description: "Proposal to add USDC (Stellar USDC issued by Circle) as an accepted deposit asset in the Axionvera Vault. This will diversify the vault's asset base and attract users who prefer stablecoin deposits. Implementation includes updating the deposit logic, adding price oracle integration for USDC/XLM conversion, and updating the reward calculation to account for multi-asset deposits.",
      proposer: "GAB...USER1",
      status: "active",
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      endsAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      executedAt: null,
      votesFor: "89000",
      votesAgainst: "21000",
      votesAbstain: "5000",
      quorum: "150000",
      threshold: "50",
      actions: [
        { type: "upgrade", target: "vault_contract", value: "0", data: "add_usdc_support" }
      ],
      metadataUri: null,
    },
    {
      id: "prop-003",
      title: "Reduce Protocol Fee from 2% to 1.5%",
      description: "Following a 3-month analysis of protocol revenue vs operational costs, this proposal recommends reducing the protocol fee from 2% to 1.5%. The reduction aims to improve competitiveness while maintaining sufficient treasury inflows for ongoing development. Revenue projections indicate the treasury will remain adequately funded at the reduced rate given current growth trajectory.",
      proposer: "GAC...USER2",
      status: "passed",
      createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      endsAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      executedAt: null,
      votesFor: "180000",
      votesAgainst: "30000",
      votesAbstain: "15000",
      quorum: "150000",
      threshold: "50",
      actions: [
        { type: "parameter_change", target: "fee_module", value: "1.5", data: "protocol_fee_bps" }
      ],
      metadataUri: null,
    },
    {
      id: "prop-004",
      title: "Emergency Pause for Contract Upgrade",
      description: "Emergency proposal to temporarily pause vault deposits and withdrawals to facilitate a critical security patch. The patch addresses a potential reentrancy vector identified in the latest audit. All funds remain safe. The pause will last maximum 48 hours and normal operations will resume automatically after upgrade completion.",
      proposer: "GAD...SECURITY",
      status: "executed",
      createdAt: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      endsAt: new Date(now.getTime() - 19 * 24 * 60 * 60 * 1000).toISOString(),
      executedAt: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString(),
      votesFor: "220000",
      votesAgainst: "5000",
      votesAbstain: "8000",
      quorum: "150000",
      threshold: "50",
      actions: [
        { type: "upgrade", target: "vault_contract", value: "0", data: "security_patch_v2_1" }
      ],
      metadataUri: null,
    },
    {
      id: "prop-005",
      title: "Introduce Governance Staking Rewards",
      description: "Proposal to implement a staking rewards mechanism for governance participants. Users who actively vote on proposals will receive additional AXV token rewards proportional to their participation rate. This incentivizes informed voting and increases overall governance engagement. Reward pool: 50,000 AXV tokens distributed over 12 months.",
      proposer: "GAE...USER3",
      status: "rejected",
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endsAt: new Date(now.getTime() - 23 * 24 * 60 * 60 * 1000).toISOString(),
      executedAt: null,
      votesFor: "65000",
      votesAgainst: "140000",
      votesAbstain: "20000",
      quorum: "150000",
      threshold: "50",
      actions: [
        { type: "parameter_change", target: "rewards_module", value: "50000", data: "governance_staking_pool" }
      ],
      metadataUri: null,
    },
    {
      id: "prop-006",
      title: "Extend Voting Period from 7 to 14 Days",
      description: "This proposal suggests extending the standard voting period from 7 days to 14 days. The longer period allows more token holders to participate, especially those who may not check the protocol daily. Analysis shows that proposals receiving votes in the final 48 hours have a 35% higher participation rate. The extension balances deliberation time with execution speed.",
      proposer: "GAF...USER4",
      status: "cancelled",
      createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      endsAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      executedAt: null,
      votesFor: "30000",
      votesAgainst: "25000",
      votesAbstain: "5000",
      quorum: "150000",
      threshold: "50",
      actions: [
        { type: "parameter_change", target: "governance_contract", value: "14", data: "voting_period_days" }
      ],
      metadataUri: null,
    },
  ];

  return {
    proposals,
    votes: {
      "prop-001": [
        { proposalId: "prop-001", voter: "GAA...VOTER1", choice: "for", weight: "50000", timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() },
        { proposalId: "prop-001", voter: "GAB...VOTER2", choice: "against", weight: "25000", timestamp: new Date(now.getTime() - 1.5 * 24 * 60 * 60 * 1000).toISOString() },
        { proposalId: "prop-001", voter: "GAC...VOTER3", choice: "for", weight: "75000", timestamp: new Date(now.getTime() - 0.5 * 24 * 60 * 60 * 1000).toISOString() },
      ],
      "prop-002": [
        { proposalId: "prop-002", voter: "GAD...VOTER4", choice: "for", weight: "40000", timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() },
        { proposalId: "prop-002", voter: "GAE...VOTER5", choice: "for", weight: "49000", timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() },
        { proposalId: "prop-002", voter: "GAF...VOTER6", choice: "against", weight: "21000", timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString() },
      ],
      "prop-003": [
        { proposalId: "prop-003", voter: "GAA...VOTER1", choice: "for", weight: "80000", timestamp: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString() },
        { proposalId: "prop-003", voter: "GAB...VOTER2", choice: "for", weight: "100000", timestamp: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000).toISOString() },
        { proposalId: "prop-003", voter: "GAC...VOTER3", choice: "against", weight: "30000", timestamp: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString() },
      ],
      "prop-004": [
        { proposalId: "prop-004", voter: "GAA...VOTER1", choice: "for", weight: "100000", timestamp: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString() },
        { proposalId: "prop-004", voter: "GAB...VOTER2", choice: "for", weight: "120000", timestamp: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString() },
        { proposalId: "prop-004", voter: "GAC...VOTER3", choice: "abstain", weight: "8000", timestamp: new Date(now.getTime() - 19 * 24 * 60 * 60 * 1000).toISOString() },
      ],
      "prop-005": [
        { proposalId: "prop-005", voter: "GAA...VOTER1", choice: "against", weight: "60000", timestamp: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString() },
        { proposalId: "prop-005", voter: "GAB...VOTER2", choice: "against", weight: "80000", timestamp: new Date(now.getTime() - 27 * 24 * 60 * 60 * 1000).toISOString() },
        { proposalId: "prop-005", voter: "GAC...VOTER3", choice: "for", weight: "65000", timestamp: new Date(now.getTime() - 26 * 24 * 60 * 60 * 1000).toISOString() },
      ],
      "prop-006": [
        { proposalId: "prop-006", voter: "GAA...VOTER1", choice: "for", weight: "15000", timestamp: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString() },
        { proposalId: "prop-006", voter: "GAB...VOTER2", choice: "against", weight: "20000", timestamp: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString() },
      ],
    },
    userVotes: {},
    stats: {
      totalProposals: 6,
      activeProposals: 2,
      totalVotesCast: 18,
      participationRate: "68.5",
      averageQuorum: "158333",
    },
    params: {
      votingDelay: 1,
      votingPeriod: 60480,
      quorumNumerator: 4,
      quorumDenominator: 100,
      proposalThreshold: "10000",
    },
  };
}

export function createAxionveraGovernanceSdk(): AxionveraGovernanceSdk {
  const baseSdk = {
    async getProposals({ network }: { network: StellarNetwork }) {
      await sleep(200);
      const gov = loadGovernance(network);
      return gov.proposals;
    },
    async getProposal({ proposalId, network }: { proposalId: string; network: StellarNetwork }) {
      await sleep(150);
      const gov = loadGovernance(network);
      return gov.proposals.find((p) => p.id === proposalId) ?? null;
    },
    async getVotes({ proposalId, network }: { proposalId: string; network: StellarNetwork }) {
      await sleep(150);
      const gov = loadGovernance(network);
      return gov.votes[proposalId] ?? [];
    },
    async getUserVotes({ walletAddress, network }: { walletAddress: string; network: StellarNetwork }) {
      await sleep(150);
      const gov = loadGovernance(network);
      return gov.userVotes[walletAddress] ?? [];
    },
    async getGovernanceStats({ network }: { network: StellarNetwork }) {
      await sleep(150);
      const gov = loadGovernance(network);
      return gov.stats;
    },
    async getGovernanceParams({ network }: { network: StellarNetwork }) {
      await sleep(150);
      const gov = loadGovernance(network);
      return gov.params;
    },
    async vote({ walletAddress, proposalId, choice, network }: { walletAddress: string; proposalId: string; choice: VoteChoice; network: StellarNetwork }) {
      await sleep(600);
      const gov = loadGovernance(network);
      const proposal = gov.proposals.find((p) => p.id === proposalId);
      if (!proposal) throw new Error("Proposal not found.");
      if (proposal.status !== "active") throw new Error("Proposal is not active.");
      if (new Date(proposal.endsAt) < new Date()) throw new Error("Voting period has ended.");

      const existingVote = (gov.userVotes[walletAddress] ?? []).find((v) => v.proposalId === proposalId);
      if (existingVote) throw new Error("You have already voted on this proposal.");

      const weight = "25000";
      const vote: Vote = {
        proposalId,
        voter: walletAddress,
        choice,
        weight,
        timestamp: new Date().toISOString(),
      };

      if (choice === "for") proposal.votesFor = (Number(proposal.votesFor) + Number(weight)).toString();
      else if (choice === "against") proposal.votesAgainst = (Number(proposal.votesAgainst) + Number(weight)).toString();
      else proposal.votesAbstain = (Number(proposal.votesAbstain) + Number(weight)).toString();

      if (!gov.votes[proposalId]) gov.votes[proposalId] = [];
      gov.votes[proposalId].push(vote);

      if (!gov.userVotes[walletAddress]) gov.userVotes[walletAddress] = [];
      gov.userVotes[walletAddress].push(vote);

      gov.stats.totalVotesCast += 1;
      saveGovernance(network, gov);

      return { hash: `GOV-${createId()}` };
    },
    async createProposal({ walletAddress, title, description, actions, network }: { walletAddress: string; title: string; description: string; actions: ProposalAction[]; network: StellarNetwork }) {
      await sleep(800);
      const gov = loadGovernance(network);
      const id = `prop-${String(gov.proposals.length + 1).padStart(3, "0")}`;
      const now = new Date();
      const proposal: Proposal = {
        id,
        title,
        description,
        proposer: walletAddress,
        status: "active",
        createdAt: now.toISOString(),
        endsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        executedAt: null,
        votesFor: "0",
        votesAgainst: "0",
        votesAbstain: "0",
        quorum: "150000",
        threshold: "50",
        actions,
        metadataUri: null,
      };
      gov.proposals.unshift(proposal);
      gov.stats.totalProposals += 1;
      gov.stats.activeProposals += 1;
      saveGovernance(network, gov);
      return { hash: `GOV-${createId()}`, proposalId: id };
    },
  };

  return {
    getProposals: withErrorHandling(withApiResilience(baseSdk.getProposals, { timeout: 5000, retries: 2 }), "getProposals"),
    getProposal: withErrorHandling(withApiResilience(baseSdk.getProposal, { timeout: 5000, retries: 2 }), "getProposal"),
    getVotes: withErrorHandling(withApiResilience(baseSdk.getVotes, { timeout: 5000, retries: 2 }), "getVotes"),
    getUserVotes: withErrorHandling(withApiResilience(baseSdk.getUserVotes, { timeout: 5000, retries: 2 }), "getUserVotes"),
    getGovernanceStats: withErrorHandling(withApiResilience(baseSdk.getGovernanceStats, { timeout: 5000, retries: 2 }), "getGovernanceStats"),
    getGovernanceParams: withErrorHandling(withApiResilience(baseSdk.getGovernanceParams, { timeout: 5000, retries: 2 }), "getGovernanceParams"),
    vote: withErrorHandling(withApiResilience(baseSdk.vote, { timeout: 10000, retries: 1 }), "vote"),
    createProposal: withErrorHandling(withApiResilience(baseSdk.createProposal, { timeout: 10000, retries: 1 }), "createProposal"),
  };
}