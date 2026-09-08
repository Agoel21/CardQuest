/**
 * The CardQuest mark: two fanned cards with a spade on the face.
 *
 * Colours come from the theme tokens rather than being baked in, so the mark
 * follows light and dark mode along with the rest of the header. The standalone
 * favicon in public/ carries its own fixed palette instead, since a browser tab
 * has no access to the page's variables.
 */
export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g transform="translate(16 16.5)">
        <rect
          x="-9.5"
          y="-9"
          width="12"
          height="17"
          rx="2.2"
          transform="rotate(-14)"
          fill="var(--text-secondary)"
          opacity="0.55"
        />
        <rect
          x="-2.5"
          y="-9"
          width="12"
          height="17"
          rx="2.2"
          transform="rotate(10)"
          fill="var(--accent)"
        />
        <path
          d="M3.6 -3.4c1.9 1.7 3.1 2.7 3.1 4.1a1.85 1.85 0 0 1-2.9 1.5c.1.9.5 1.5 1 2h-2.4c.5-.5.9-1.1 1-2a1.85 1.85 0 0 1-2.9-1.5c0-1.4 1.2-2.4 3.1-4.1z"
          transform="rotate(10)"
          fill="var(--accent-ink)"
        />
      </g>
    </svg>
  );
}
