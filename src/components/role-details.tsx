"use client";

import { motion } from "motion/react";
import type { Role } from "@/content/profile";

// Achievements as a numbered, two-column list plus the stack. Shared by the
// timeline variants that don't use the git-diff presentation.
export function RoleDetails({ role }: { role: Role }) {
  return (
    <div>
      <ol className="grid gap-x-10 gap-y-4 md:grid-cols-2">
        {role.details.map((line, i) => (
          <motion.li
            key={line}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.04, duration: 0.3 }}
            className="grid grid-cols-[2rem_1fr] text-sm leading-relaxed"
          >
            <span className="pt-0.5 font-mono text-[11px] text-amber">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-fg/85">{line}</span>
          </motion.li>
        ))}
      </ol>
      <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-line pt-5">
        {role.stack.map((tech) => (
          <span key={tech} className="rounded-md border border-line-strong px-2 py-0.5 font-mono text-[11px] text-fg-muted">
            {tech}
          </span>
        ))}
      </div>
    </div>
  );
}
