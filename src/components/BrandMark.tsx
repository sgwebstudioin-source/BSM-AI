export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        className="drop-shadow-[0_0_18px_rgba(34,211,238,0.45)]"
      >
        <defs>
          <linearGradient id="bm-g" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#22D3EE" />
            <stop offset="1" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="14" fill="#0A0C14" />
        <path
          d="M14 44 L26 22 L34 36 L42 18 L52 44"
          stroke="url(#bm-g)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="42" cy="18" r="3" fill="#A3E635" />
      </svg>
      <span className="font-display text-lg font-semibold tracking-tight text-slate-100">
        OptiModel <span className="text-accent-cyan">AI</span>
      </span>
    </span>
  );
}
