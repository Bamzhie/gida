type PropertyArtworkProps = {
  propertyType: string;
  className?: string;
};

export function PropertyArtwork({ propertyType, className }: PropertyArtworkProps) {
  const isHouse = propertyType === "HOUSE" || propertyType === "TOWNHOUSE";
  const isLand = propertyType === "LAND";
  const isCommercial = propertyType === "COMMERCIAL";

  return (
    <svg
      viewBox="0 0 640 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="640" height="360" fill="#EDE5D7" />
      <circle cx="500" cy="82" r="39" fill="#D5A77C" opacity=".72" />
      <path d="M0 247C97 217 172 235 261 219C363 201 484 212 640 178V360H0V247Z" fill="#D9D4C2" />
      <path d="M0 283C116 256 237 278 350 251C469 222 556 239 640 216V360H0V283Z" fill="#C5C5AD" />
      <g fill="#766D5D" opacity=".48">
        <rect x="42" y="161" width="54" height="123" rx="3" />
        <rect x="103" y="137" width="45" height="147" rx="3" />
        <rect x="499" y="144" width="54" height="109" rx="3" />
        <rect x="561" y="168" width="43" height="85" rx="3" />
      </g>
      <g fill="#F8F6F0">
        {isLand ? (
          <>
            <path d="M214 118L424 145L398 279L192 251L214 118Z" fill="#C8B896" />
            <path d="M214 118L424 145M207 153L417 180M200 188L410 215M196 223L404 250" stroke="#8F8A7C" strokeWidth="3" strokeDasharray="9 7" />
            <path d="M214 118L192 251M283 127L261 260M354 136L332 270M424 145L398 279" stroke="#B1552E" strokeWidth="2" />
          </>
        ) : isCommercial ? (
          <>
            <path d="M190 165L320 95L450 165V281H190V165Z" />
            <path d="M176 166L320 86L464 166" stroke="#B1552E" strokeWidth="14" strokeLinejoin="round" />
            <rect x="216" y="190" width="208" height="91" rx="3" fill="#9CA59A" />
            <path d="M216 190L320 164L424 190" fill="#B9A991" />
            <rect x="233" y="210" width="160" height="7" fill="#F8F6F0" opacity=".8" />
            <rect x="233" y="233" width="160" height="7" fill="#F8F6F0" opacity=".8" />
            <rect x="233" y="256" width="160" height="7" fill="#F8F6F0" opacity=".8" />
          </>
        ) : isHouse ? (
          <>
            <path d="M207 177L320 97L433 177V283H207V177Z" />
            <path d="M193 178L320 85L447 178L436 193L320 109L204 193L193 178Z" fill="#B1552E" />
            <rect x="294" y="207" width="52" height="76" rx="2" fill="#B9A991" />
            <rect x="229" y="191" width="43" height="39" rx="2" fill="#9CA59A" />
            <rect x="369" y="191" width="43" height="39" rx="2" fill="#9CA59A" />
          </>
        ) : (
          <>
            <rect x="225" y="77" width="190" height="206" rx="5" />
            <rect x="211" y="67" width="218" height="17" rx="4" fill="#B1552E" />
            <rect x="208" y="279" width="224" height="11" rx="3" fill="#8E8877" />
            {Array.from({ length: 3 }).map((_, row) =>
              Array.from({ length: 3 }).map((_, col) => (
                <rect
                  key={`${row}-${col}`}
                  x={246 + col * 54}
                  y={103 + row * 54}
                  width="31"
                  height="34"
                  rx="2"
                  fill="#9CA59A"
                />
              )),
            )}
            <rect x="303" y="229" width="34" height="54" fill="#B9A991" />
          </>
        )}
      </g>
      <path d="M0 313C141 298 227 320 358 306C464 295 557 300 640 287V360H0V313Z" fill="#A4A48D" opacity=".8" />
      <path d="M0 336H640" stroke="#F8F6F0" strokeOpacity=".62" strokeWidth="2" />
    </svg>
  );
}
