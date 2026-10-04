export function IconoPesa({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12" />
    </svg>
  );
}

export function Logo({ oscuro = true }: { oscuro?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-lima text-carbon">
        <IconoPesa />
      </div>
      <div className={`titulo text-[26px] tracking-wide ${oscuro ? "text-white" : "text-carbon"}`}>
        Rutina<span className={oscuro ? "text-lima" : "text-lima-oscuro"}>Pro</span>
      </div>
    </div>
  );
}
