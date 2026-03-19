import { useId, type SVGProps } from 'react'

export default function AutomataLogo(props: SVGProps<SVGSVGElement>) {
  const baseId = useId().replace(/:/g, '')
  const glowId = `${baseId}-glow`
  const beamId = `${baseId}-beam`
  const nodeId = `${baseId}-node`
  const coreId = `${baseId}-core`

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <defs>
        <radialGradient
          id={glowId}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(16 15.75) rotate(90) scale(11.75)"
        >
          <stop offset="0" stopColor="#67E8F9" stopOpacity="0.32" />
          <stop offset="0.58" stopColor="#6366F1" stopOpacity="0.18" />
          <stop offset="1" stopColor="#0F172A" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id={beamId}
          x1="8.75"
          y1="22.75"
          x2="23.45"
          y2="8.75"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#67E8F9" />
          <stop offset="0.52" stopColor="#7DD3FC" />
          <stop offset="1" stopColor="#818CF8" />
        </linearGradient>
        <linearGradient
          id={nodeId}
          x1="9"
          y1="23"
          x2="24"
          y2="9"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#CFFAFE" />
          <stop offset="1" stopColor="#A5B4FC" />
        </linearGradient>
        <radialGradient
          id={coreId}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(15.65 15.8) rotate(90) scale(4.8)"
        >
          <stop offset="0" stopColor="#E0F2FE" />
          <stop offset="0.45" stopColor="#7DD3FC" />
          <stop offset="1" stopColor="#6366F1" />
        </radialGradient>
      </defs>

      <circle cx="16" cy="15.75" r="11.75" fill={`url(#${glowId})`} />
      <path
        d="M8.75 22.75L15.65 15.8L23.45 8.75"
        stroke={`url(#${beamId})`}
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M15.65 15.8L22.15 19.9"
        stroke={`url(#${beamId})`}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        opacity="0.92"
      />
      <circle cx="8.75" cy="22.75" r="2.25" fill={`url(#${nodeId})`} />
      <circle cx="23.45" cy="8.75" r="2.25" fill={`url(#${nodeId})`} />
      <circle cx="22.15" cy="19.9" r="1.85" fill={`url(#${nodeId})`} />
      <circle
        cx="15.65"
        cy="15.8"
        r="4.2"
        fill="#081121"
        fillOpacity="0.54"
        stroke="#7DD3FC"
        strokeOpacity="0.2"
        strokeWidth="1"
      />
      <circle cx="15.65" cy="15.8" r="3.2" fill={`url(#${coreId})`} />
      <circle cx="15.65" cy="15.8" r="1.15" fill="#F8FAFC" />
    </svg>
  )
}
