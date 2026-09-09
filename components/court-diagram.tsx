import type { Sport } from "@/lib/sports";

/*
 * Court line diagrams drawn to real court proportions — the viewBox of each
 * is the court's actual dimensions in feet, so the aspect ratios and every
 * internal line sit where they do on a real court.
 *
 * This is information design (Vignelli's subway map lineage), not decorative
 * illustration: the anti-cliché rule bans AI-drawn scenes and objects, and
 * bans CSS silhouettes standing in for product photography. A dimensionally
 * accurate diagram is neither — it carries real information about the sport.
 */

interface CourtSpec {
  /** Court dimensions in feet: [length, width] — becomes the viewBox. */
  box: [number, number];
  /** Interior markings. */
  lines: Array<[number, number, number, number]>;
  /** x-position of the net, if the sport has one. */
  net?: number;
  dimensions: string;
}

const COURTS: Record<Sport, CourtSpec> = {
  Tennis: {
    box: [78, 36],
    net: 39,
    lines: [
      // Singles sidelines, 4.5ft inside each doubles line.
      [0, 4.5, 78, 4.5],
      [0, 31.5, 78, 31.5],
      // Service lines, 21ft from the net.
      [18, 4.5, 18, 31.5],
      [60, 4.5, 60, 31.5],
      // Centre service line.
      [18, 18, 60, 18],
    ],
    dimensions: "78 × 36 ft",
  },
  Pickleball: {
    box: [44, 20],
    net: 22,
    lines: [
      // Non-volley zone ("the kitchen"), 7ft off the net each side.
      [15, 0, 15, 20],
      [29, 0, 29, 20],
      // Centre lines, only outside the kitchen.
      [0, 10, 15, 10],
      [29, 10, 44, 10],
    ],
    dimensions: "44 × 20 ft",
  },
  Badminton: {
    box: [44, 20],
    net: 22,
    lines: [
      // Singles sidelines, 1.5ft inside.
      [0, 1.5, 44, 1.5],
      [0, 18.5, 44, 18.5],
      // Short service lines, 6.5ft off the net.
      [15.5, 0, 15.5, 20],
      [28.5, 0, 28.5, 20],
      // Doubles long service lines, 2.5ft in from the back.
      [2.5, 0, 2.5, 20],
      [41.5, 0, 41.5, 20],
      // Centre lines.
      [0, 10, 15.5, 10],
      [28.5, 10, 44, 10],
    ],
    dimensions: "44 × 20 ft",
  },
 "Table Tennis": {
    box: [9, 5],
    net: 4.5,
    lines: [
      // Centre line, for doubles.
      [0, 2.5, 9, 2.5],
    ],
    dimensions: "9 × 5 ft",
  },
};

export function CourtDiagram({ sport, className }: { sport: Sport; className?: string }) {
  const court = COURTS[sport];
  const [length, width] = court.box;
  // Keep every stroke visually identical regardless of how the court scales.
  const stroke = length / 110;

  return (
    <svg
      viewBox={`0 0 ${length} ${width}`}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      vectorEffect="non-scaling-stroke"
      aria-hidden
      focusable="false"
    >
      <rect x={0} y={0} width={length} height={width} />
      {court.lines.map((line, i) => (
        <line key={i} x1={line[0]} y1={line[1]} x2={line[2]} y2={line[3]} />
      ))}
      {court.net !== undefined ? (
        // Same weight as every other line — the dash alone distinguishes it.
        // A heavier stroke reads as a wall rather than a net.
        <line
          x1={court.net}
          y1={0}
          x2={court.net}
          y2={width}
          strokeDasharray={`${stroke * 3} ${stroke * 3}`}
        />
      ) : null}
    </svg>
  );
}

export function courtDimensions(sport: Sport): string {
  return COURTS[sport].dimensions;
}
