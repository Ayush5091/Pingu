import type { YearProgress } from "@/lib/journey";

// Decorative backdrop behind each year's stretch of the path on wide screens,
// so the winding trail sits in a little world instead of an empty column.
// Purely visual: hidden from assistive tech and below the trail.
export default function YearScenery({ year }: { year: YearProgress }) {
  const locked = !year.unlocked;
  const ink = locked ? "#C9D5E3" : year.color;
  const soft = locked ? "#EEF3F8" : year.soft;
  const Art = ART[year.year];
  const fade = `scenery-fade-${year.year}`;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 top-[44px] -z-10 hidden overflow-hidden rounded-[40px] lg:block"
      style={{ background: `linear-gradient(180deg, ${soft} 0%, ${soft}99 55%, transparent 100%)` }}
    >
      <svg className="absolute left-0 top-10 h-[78%] w-[180px] [mask-image:linear-gradient(to_right,#000_60%,transparent)]" viewBox="0 0 180 600" preserveAspectRatio="xMinYMin meet" fill="none">
        <Fade id={`${fade}-l`} ink={ink} />
        <Art ink={ink} side="left" ground={`url(#${fade}-l)`} />
      </svg>
      <svg className="absolute right-0 top-24 h-[78%] w-[180px] [mask-image:linear-gradient(to_left,#000_60%,transparent)]" viewBox="0 0 180 600" preserveAspectRatio="xMaxYMin meet" fill="none">
        <Fade id={`${fade}-r`} ink={ink} />
        <g transform="translate(180 0) scale(-1 1)">
          <Art ink={ink} side="right" ground={`url(#${fade}-r)`} />
        </g>
      </svg>
      <svg className="absolute inset-x-0 bottom-0 h-24 w-full" viewBox="0 0 800 96" preserveAspectRatio="none">
        <path d="M0 60 C120 30 220 70 340 52 C470 32 560 72 680 50 C740 40 780 48 800 44 L800 96 L0 96Z" fill={ink} opacity="0.08" />
      </svg>
    </div>
  );
}

// `ground` is a top-to-transparent fill so hills and peaks melt into the
// backdrop instead of ending on a hard edge.
type ArtProps = { ink: string; side: "left" | "right"; ground: string };

function Fade({ id, ink }: { id: string; ink: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={ink} stopOpacity="0.2" />
        <stop offset="1" stopColor={ink} stopOpacity="0" />
      </linearGradient>
    </defs>
  );
}

function Flake({ x, y, s = 1, ink }: { x: number; y: number; s?: number; ink: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={ink} strokeWidth="3" strokeLinecap="round" opacity="0.35">
      <path d="M0 -10V10M-8.7 -5L8.7 5M-8.7 5L8.7 -5" />
    </g>
  );
}

function Pine({ x, y, s = 1, ink }: { x: number; y: number; s?: number; ink: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 -60 L22 -22 H12 L30 6 H-30 L-12 -22 H-22Z" fill={ink} opacity="0.22" />
      <path d="M0 -60 L10 -42 L-2 -38 L8 -30 L-14 -26Z" fill="#fff" opacity="0.7" />
      <rect x="-4" y="6" width="8" height="12" rx="2" fill={ink} opacity="0.3" />
    </g>
  );
}

function Snowfield({ ink, side, ground }: ArtProps) {
  const alt = side === "right";
  return (
    <>
      <path d="M-20 300 C30 260 90 270 140 300 C160 312 172 318 180 326 V460 H-20Z" fill={ground} />
      <Pine x={52} y={290} s={1.1} ink={ink} />
      <Pine x={104} y={312} s={0.75} ink={ink} />
      <Flake x={alt ? 120 : 60} y={70} ink={ink} />
      <Flake x={alt ? 40 : 130} y={150} s={0.7} ink={ink} />
      <Flake x={80} y={460} s={0.9} ink={ink} />
      <circle cx={alt ? 70 : 140} cy={220} r={5} fill={ink} opacity="0.2" />
      <circle cx={30} cy={520} r={4} fill={ink} opacity="0.2" />
    </>
  );
}

function IceCaves({ ink, side }: ArtProps) {
  const alt = side === "right";
  return (
    <>
      <path d="M0 0 H180 L160 40 L140 18 L118 70 L96 22 L72 54 L50 16 L26 46 L0 20Z" fill={ink} opacity="0.14" />
      <g opacity="0.28" fill={ink}>
        <path d="M40 330 L58 270 L76 330Z" />
        <path d="M66 330 L92 230 L118 330Z" />
        <path d="M108 330 L122 286 L136 330Z" />
      </g>
      <g fill="#fff" opacity="0.6">
        <path d="M92 230 L98 262 L88 252Z" />
        <path d="M58 270 L62 292 L54 286Z" />
      </g>
      <path d="M20 330 H160" stroke={ink} strokeWidth="4" strokeLinecap="round" opacity="0.2" />
      <g stroke={ink} strokeWidth="3" strokeLinecap="round" opacity="0.3">
        <path d={alt ? "M120 150 l10 -10 l10 10 l-10 10z" : "M50 160 l10 -10 l10 10 l-10 10z"} fill="none" />
        <path d="M110 470 l8 -8 l8 8 l-8 8z" fill="none" />
      </g>
      <Flake x={60} y={420} s={0.8} ink={ink} />
    </>
  );
}

function Aurora({ ink, side, ground }: ArtProps) {
  const alt = side === "right";
  return (
    <>
      <path d="M-10 60 C40 20 80 110 130 60 C150 40 170 50 190 40" stroke={ink} strokeWidth="18" strokeLinecap="round" opacity="0.12" />
      <path d="M-10 100 C50 70 90 140 140 100 C160 84 175 90 190 84" stroke={ink} strokeWidth="10" strokeLinecap="round" opacity="0.1" />
      <path d="M-20 380 L40 290 L70 320 L110 250 L170 340 L180 334 V460 H-20Z" fill={ground} />
      <path d="M110 250 L124 272 L112 268 L102 280 L96 268Z" fill="#fff" opacity="0.7" />
      <g fill={ink} opacity="0.4">
        <circle cx={alt ? 40 : 140} cy={170} r={3} />
        <circle cx={alt ? 120 : 60} cy={200} r={2} />
        <circle cx={90} cy={150} r={2.5} />
        <circle cx={50} cy={480} r={3} />
      </g>
    </>
  );
}

function Summit({ ink, side, ground }: ArtProps) {
  const alt = side === "right";
  return (
    <>
      <path d="M-20 440 L60 210 L100 270 L140 190 L180 356 V440Z" fill={ground} />
      <path d="M60 210 L78 252 L64 246 L52 262 L46 244Z" fill="#fff" opacity="0.75" />
      <path d="M140 190 L156 228 L142 222 L130 236 L126 220Z" fill="#fff" opacity="0.75" />
      {!alt && (
        <g transform="translate(140 190)">
          <path d="M0 0 V-46" stroke={ink} strokeWidth="3.5" strokeLinecap="round" opacity="0.5" />
          <path d="M0 -46 L26 -38 L0 -28Z" fill={ink} opacity="0.45" />
        </g>
      )}
      <g fill={ink} opacity="0.25">
        <ellipse cx={alt ? 120 : 50} cy={90} rx={30} ry={10} />
        <ellipse cx={alt ? 70 : 120} cy={120} rx={20} ry={7} />
      </g>
      <Flake x={90} y={480} s={0.8} ink={ink} />
    </>
  );
}

const ART: Record<1 | 2 | 3 | 4, (p: ArtProps) => React.ReactElement> = {
  1: Snowfield,
  2: IceCaves,
  3: Aurora,
  4: Summit,
};
