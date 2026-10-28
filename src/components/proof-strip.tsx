import { CountUp } from "@/components/motion-primitives";
import { proofPoints } from "@/content/profile";

export function ProofStrip() {
  return (
    <section aria-label="Results at a glance" className="border-y border-line">
      <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-line md:grid-cols-4">
        {proofPoints.map((p) => (
          <div key={p.label} className="flex flex-col-reverse justify-end bg-ink px-6 py-8">
            <dt className="mt-2 text-sm leading-snug text-fg-muted">{p.label}</dt>
            <dd className="text-3xl font-semibold tracking-[-0.03em] tabular-nums">
              <CountUp from={p.from} to={p.to} prefix={p.prefix} suffix={p.suffix} />
              <span className="ml-0.5 font-mono text-sm font-normal text-amber">{p.unit}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
