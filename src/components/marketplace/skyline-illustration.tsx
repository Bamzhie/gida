export function SkylineIllustration() {
  return (
    <svg
      viewBox="0 0 480 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
      role="img"
      aria-label="Illustration of a city skyline with one building highlighted"
    >
      <ellipse cx="240" cy="360" rx="210" ry="18" fill="var(--muted)" />

      {/* background skyline, muted */}
      <g fill="var(--foreground)" opacity="0.08">
        <rect x="20" y="190" width="46" height="170" rx="4" />
        <rect x="76" y="150" width="38" height="210" rx="4" />
        <rect x="360" y="170" width="42" height="190" rx="4" />
        <rect x="410" y="210" width="50" height="150" rx="4" />
        <rect x="120" y="230" width="34" height="130" rx="4" />
      </g>

      {/* mid skyline */}
      <g fill="var(--foreground)" opacity="0.16">
        <rect x="60" y="130" width="52" height="230" rx="6" />
        <rect x="330" y="110" width="56" height="250" rx="6" />
      </g>

      {/* focal building, brand green */}
      <g>
        <rect x="190" y="60" width="100" height="300" rx="8" fill="var(--primary)" />
        {Array.from({ length: 6 }).map((_, row) =>
          Array.from({ length: 4 }).map((_, col) => (
            <rect
              key={`${row}-${col}`}
              x={204 + col * 22}
              y={80 + row * 44}
              width="12"
              height="18"
              rx="1.5"
              fill="var(--primary-foreground)"
              opacity="0.55"
            />
          ))
        )}
      </g>

      {/* location pin above the focal building */}
      <g>
        <path
          d="M240 8c-14 0-25 11-25 25 0 18 25 40 25 40s25-22 25-40c0-14-11-25-25-25Z"
          fill="var(--foreground)"
        />
        <circle cx="240" cy="33" r="9" fill="var(--background)" />
      </g>

      {/* secondary buildings flanking the focal one */}
      <g fill="var(--foreground)" opacity="0.9">
        <rect x="150" y="150" width="34" height="210" rx="5" />
        <rect x="296" y="180" width="30" height="180" rx="5" />
      </g>
    </svg>
  );
}
