import { formatAmount } from "@/utils/contractHelpers";
import type { SimulationResult } from "@/hooks/useTransactionSimulation";

type TransactionSimulationPreviewProps = {
  result: SimulationResult;
  isSubmitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

function Row({ label, value, highlight }: { label: string; value: string; highlight?: "positive" | "negative" | "neutral" }) {
  const valueClass = highlight === "positive" ? "text-emerald-400" : highlight === "negative" ? "text-rose-400" : "text-text-primary";
  return (
    <div className="flex items-center justify-between py-2 text-xs">
      <span className="text-text-muted">{label}</span>
      <span className={`font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}

export function TransactionSimulationPreview({ result, isSubmitting, onConfirm, onCancel }: TransactionSimulationPreviewProps) {
  const isDeposit = result.type === "deposit";
  const netChange = parseFloat(result.netChange);
  return (
    <div role="dialog" aria-modal="true" aria-label="Transaction preview" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border-primary bg-background-primary p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-full ${isDeposit ? "bg-axion-500/15" : "bg-amber-500/15"}`}>
            <svg className={`h-4 w-4 ${isDeposit ? "text-axion-400" : "text-amber-400"}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {isDeposit ? <path d="M12 5v14M5 12l7 7 7-7" /> : <path d="M12 19V5M5 12l7-7 7 7" />}
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-text-primary">Preview {isDeposit ? "Deposit" : "Withdrawal"}</div>
            <div className="text-xs text-text-muted">Review before confirming</div>
          </div>
        </div>
        <div className={`mb-4 rounded-xl border px-4 py-3 text-center ${isDeposit ? "border-axion-500/30 bg-axion-500/10" : "border-amber-500/30 bg-amber-500/10"}`}>
          <div className="text-xs text-text-muted">Amount</div>
          <div className={`mt-0.5 text-2xl font-bold ${isDeposit ? "text-axion-400" : "text-amber-400"}`}>
            {netChange > 0 ? "+" : ""}{formatAmount(result.netChange)} XLM
          </div>
        </div>
        <div className="divide-y divide-border-primary/50 rounded-xl border border-border-primary bg-background-secondary/20 px-4">
          <Row label="Current Balance" value={`${formatAmount(result.currentBalance)} XLM`} />
          <Row label="Projected Balance" value={`${formatAmount(result.projectedBalance)} XLM`} highlight={isDeposit ? "positive" : "neutral"} />
          {isDeposit && <Row label="Projected Rewards" value={`${formatAmount(result.projectedRewards)} XLM`} highlight="positive" />}
          <Row label="Estimated Network Fee" value={`~${result.estimatedFee} XLM`} />
        </div>
        <p className="mt-3 text-center text-[11px] text-text-muted">This is a simulation. Actual results may vary slightly.</p>
        <div className="mt-4 flex gap-3">
          <button type="button" onClick={onCancel} disabled={isSubmitting} className="flex-1 rounded-xl border border-border-primary bg-background-secondary/30 px-4 py-2.5 text-sm font-medium text-text-primary transition hover:bg-background-secondary/60 disabled:cursor-not-allowed disabled:opacity-50">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={isSubmitting} aria-label={isSubmitting ? "Processing transaction" : `Confirm ${result.type}`} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-70 ${isDeposit ? "bg-axion-500 shadow-axion-500/20 hover:bg-axion-400" : "bg-amber-500 shadow-amber-500/20 hover:bg-amber-400"}`}>
            {isSubmitting ? (
              <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (`Confirm ${isDeposit ? "Deposit" : "Withdrawal"}`)}
          </button>
        </div>
      </div>
    </div>
  );
}