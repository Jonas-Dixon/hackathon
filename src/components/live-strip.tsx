import { SourceChip } from "@/components/source-mark";
import type { ApiCall, LiveSnapshot } from "@/lib/live";
import { cn } from "@/lib/utils";

function when(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("sv-SE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function CallRow({ call }: { call: ApiCall }) {
  const code =
    call.http == null ? (call.locked ? "låst" : "—") : String(call.http);
  const tone = call.ok ? "text-clear" : call.locked ? "text-watch" : "text-storm";

  return (
    <article className="border-b border-border last:border-b-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-3 py-2.5">
        <span className="font-mono text-[10px] tracking-wide text-subtle uppercase">{call.method}</span>
        <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-fg">{call.path}</span>
        <span className={cn("font-mono text-[11px] tabular", tone)}>{code}</span>
      </div>
      <dl className="grid grid-cols-[minmax(7rem,32%)_1fr] gap-x-3 gap-y-1 px-3 pb-3">
        {call.fields.map((f, i) => (
          <div key={`${f.k}-${i}`} className="contents">
            <dt className="truncate font-mono text-[10px] text-subtle">{f.k}</dt>
            <dd className="truncate font-mono text-[11px] text-muted">{f.v}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function Column({
  source,
  title,
  hint,
  calls,
}: {
  source: "op" | "zg";
  title: string;
  hint: string;
  calls: ApiCall[];
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <header className="flex items-start justify-between gap-3 border-b border-border px-3 py-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">{title}</p>
          <p className="mt-1 text-[13px] text-muted">{hint}</p>
        </div>
        <SourceChip id={source === "op" ? "bank" : "boks"} />
      </header>
      <div>
        {calls.map((c) => (
          <CallRow key={c.id} call={c} />
        ))}
      </div>
    </div>
  );
}

export function LiveStrip({ live }: { live: LiveSnapshot }) {
  const opCalls = live.calls.filter((c) => c.source === "op");
  const zgCalls = live.calls.filter((c) => c.source === "zg");
  const zg = live.zg.consents[0];

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium text-fg">Live anrop</h2>
          <p className="text-[13px] text-muted">Svaren som nycklarna faktiskt gav. Tomt fält = låst steg.</p>
        </div>
        <p className="font-mono text-[10px] text-subtle">hämtad {when(live.fetchedAt)}</p>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <Column
          source="op"
          title="Open Payments"
          hint={
            live.op.ok
              ? `${live.op.aspspCount} aspsps · ${live.op.scope || "token"}`
              : live.op.error ?? "Ingen kontakt"
          }
          calls={opCalls}
        />
        <Column
          source="zg"
          title="Zwapgrid"
          hint={
            live.zg.ok
              ? `${zg?.name ?? "consent"} · ${zg?.status ?? "tom"}`
              : live.zg.error ?? "Ingen kontakt"
          }
          calls={zgCalls}
        />
      </div>
    </section>
  );
}
