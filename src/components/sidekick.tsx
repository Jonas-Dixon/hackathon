import { COMPANY } from "@/lib/engine";

export function Sidekick({ notes }: { notes: string[] }) {
  return (
    <aside className="rounded-lg border border-border bg-card p-4 md:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] tracking-[0.2em] text-subtle uppercase">Analys</p>
        <p className="font-mono text-[10px] text-muted">gissar · styr inte</p>
      </div>
      <p className="mt-2 text-[15px] font-medium leading-snug text-fg">
        {COMPANY.trade}. Inte ett beslut — bara kontext.
      </p>
      <ul className="mt-3 space-y-2">
        {notes.map((n) => (
          <li key={n} className="text-sm leading-relaxed text-muted">
            {n}
          </li>
        ))}
      </ul>
    </aside>
  );
}
