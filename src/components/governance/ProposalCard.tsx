import { useMemo } from "react";
import { type Proposal, type ProposalStatus, type Vote } from "@/utils/contractHelpersGovernance";
import { shortenAddress, formatAmount } from "@/utils/contractHelpers";

interface ProposalCardProps {
  proposal: Proposal;
  userVotes: Vote[];
  onSelect: (proposal: Proposal) => void;
  isSelected?: boolean;
}

function statusStyles(status: ProposalStatus) {
  switch (status) {
    case "active":
      return "border-axion-500/50 bg-axion-950/20 text-axion-300";
    case "passed":
      return "border-emerald-500/50 bg-emerald-950/20 text-emerald-300";
    case "rejected":
      return "border-rose-500/50 bg-rose-950/20 text-rose-300";
    case "executed":
      return "border-violet-500/50 bg-violet-950/20 text-violet-300";
    case "cancelled":
      return "border-amber-500/50 bg-amber-950/20 text-amber-300";
  }
}

function statusLabel(status: ProposalStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function timeRemaining(endDate: string, status: ProposalStatus) {
  if (status !== "active") return null;
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h left`;
  return `${hours}h left`;
}

export default function ProposalCard({ proposal, userVotes, onSelect, isSelected }: ProposalCardProps) {
  const totalVotes = useMemo(
    () => Number(proposal.votesFor) + Number(proposal.votesAgainst) + Number(proposal.votesAbstain),
    [proposal]
  );

  const forPercentage = useMemo(
    () => (totalVotes > 0 ? (Number(proposal.votesFor) / totalVotes) * 100 : 0),
    [proposal, totalVotes]
  );

  const againstPercentage = useMemo(
    () => (totalVotes > 0 ? (Number(proposal.votesAgainst) / totalVotes) * 100 : 0),
    [proposal, totalVotes]
  );

  const abstainPercentage = useMemo(
    () => (totalVotes > 0 ? (Number(proposal.votesAbstain) / totalVotes) * 100 : 0),
    [proposal, totalVotes]
  );

  const userVote = useMemo(
    () => userVotes.find((v) => v.proposalId === proposal.id),
    [userVotes, proposal.id]
  );

  const remaining = timeRemaining(proposal.endsAt, proposal.status);

  return (
    <button
      onClick={() => onSelect(proposal)}
      className={`w-full text-left rounded-xl border p-4 transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-axion-500/50 ${
        isSelected
          ? "border-axion-500 bg-axion-950/10 shadow-md"
          : "border-border-primary bg-background-primary hover:border-axion-500/30"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-text-primary truncate">{proposal.title}</h3>
          <p className="mt-1 text-sm text-text-secondary line-clamp-2">{proposal.description}</p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyles(proposal.status)}`}
        >
          {statusLabel(proposal.status)}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-text-muted">
        <span>Proposer: {shortenAddress(proposal.proposer, 4)}</span>
        <span>•</span>
        <span>{new Date(proposal.createdAt).toLocaleDateString()}</span>
        {remaining && (
          <>
            <span>•</span>
            <span className="text-axion-400">{remaining}</span>
          </>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex h-2 overflow-hidden rounded-full bg-background-secondary">
          <div
            className="bg-emerald-500 transition-all"
            style={{ width: `${forPercentage}%` }}
          />
          <div
            className="bg-rose-500 transition-all"
            style={{ width: `${againstPercentage}%` }}
          />
          <div
            className="bg-amber-500 transition-all"
            style={{ width: `${abstainPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-emerald-400">For: {formatAmount(proposal.votesFor)}</span>
          <span className="text-rose-400">Against: {formatAmount(proposal.votesAgainst)}</span>
          <span className="text-amber-400">Abstain: {formatAmount(proposal.votesAbstain)}</span>
        </div>
      </div>

      {userVote && (
        <div className="mt-3 rounded-lg bg-background-secondary/50 px-3 py-1.5 text-xs text-text-secondary">
          You voted{" "}
          <span
            className={`font-medium ${
              userVote.choice === "for"
                ? "text-emerald-400"
                : userVote.choice === "against"
                ? "text-rose-400"
                : "text-amber-400"
            }`}
          >
            {userVote.choice}
          </span>{" "}
          with {formatAmount(userVote.weight)} weight
        </div>
      )}
    </button>
  );
}