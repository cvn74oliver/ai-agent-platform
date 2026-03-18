import type { SVGProps } from 'react'

export default function AutomataLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M8.5 22.5L16 15.5L23.5 8.5"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx="8.5" cy="22.5" r="2.65" fill="currentColor" />
      <circle cx="16" cy="15.5" r="2.65" fill="currentColor" />
      <circle cx="23.5" cy="8.5" r="2.65" fill="currentColor" />
    </svg>
  )
}
