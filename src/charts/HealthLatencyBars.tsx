import type { ProtocolHealthStatus } from "@/services/protocolHealth";

type HealthLatencyBarsProps = {
  data: Array<{ label: string; latencyMs: number; status: ProtocolHealthStatus }>;
};

const STATUS_CLASS: Record<ProtocolHealthStatus, string> = {
  operational: "bg-emerald-500",
  degraded: "bg-amber-500",
  down: "bg-red-500",
};

export default function HealthLatencyBars({ data }: HealthLatencyBarsProps) {
  const maxLatency = Math.max(...data.map((item) => item.latencyMs), 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Endpoint Latency</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Latest frontend probe response time.</p>
      </div>
      <div className="space-y-4">
        {data.map((item) => {
          const width = `${Math.max(8, Math.round((item.latencyMs / maxLatency) * 100))}%`;
          return (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-200">{item.label}</span>
                <span className="tabular-nums text-slate-500 dark:text-slate-400">{item.latencyMs} ms</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className={`h-full rounded-full ${STATUS_CLASS[item.status]}`} style={{ width }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
