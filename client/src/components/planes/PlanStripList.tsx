import { PlanStrip, type Plan } from "./PlanStrip";

export function PlanStripList({ plans }: { plans: Plan[] }) {
  // El plan destacado (con badge) va primero — es la señal "más popular".
  const ordenados = [...plans].sort((a, b) => Number(!a.badge) - Number(!b.badge));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-3">
      {ordenados.map((p) => (
        <PlanStrip key={p.id} plan={p} />
      ))}
    </div>
  );
}
