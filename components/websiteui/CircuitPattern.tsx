"use client";

export default function CircuitPattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.12]"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="circuit-pattern"
          x="0"
          y="0"
          width="100"
          height="100"
          patternUnits="userSpaceOnUse"
        >
          {/* Horizontal lines */}
          <path
            d="M0 20 H40 M60 20 H100"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
          />
          <path
            d="M0 50 H30 M70 50 H100"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
          />
          <path
            d="M0 80 H45 M55 80 H100"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
          />

          {/* Vertical lines */}
          <path
            d="M20 0 V35 M20 65 V100"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
          />
          <path
            d="M50 0 V25 M50 75 V100"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
          />
          <path
            d="M80 0 V40 M80 60 V100"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
          />

          {/* Connection nodes */}
          <circle cx="20" cy="20" r="3" fill="currentColor" />
          <circle cx="50" cy="50" r="4" fill="currentColor" />
          <circle cx="80" cy="20" r="2" fill="currentColor" />
          <circle cx="20" cy="80" r="2" fill="currentColor" />
          <circle cx="80" cy="80" r="3" fill="currentColor" />

          {/* Corner connectors */}
          <path
            d="M40 20 L50 20 L50 25"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
          />
          <path
            d="M50 75 L50 80 L55 80"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
          />
          <path
            d="M20 35 L20 50 L30 50"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
          />
          <path
            d="M70 50 L80 50 L80 60"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
          />

          {/* Small accent squares */}
          <rect
            x="48"
            y="18"
            width="4"
            height="4"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
          />
          <rect
            x="18"
            y="48"
            width="4"
            height="4"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
          />
          <rect
            x="78"
            y="78"
            width="4"
            height="4"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#circuit-pattern)" />
    </svg>
  );
}
