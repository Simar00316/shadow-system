// Original 24px stroke icon set (design/DESIGN.md §9). Each icon is SVG children drawn on a 24x24 grid.
import type { SVGProps } from 'react'

const P = {
  // stats
  str: <><path d="M6 14l8-8 4 4-8 8z" /><path d="M14 6l2-2 4 4-2 2" /><path d="M6 14l-2 4 2 2 4-2" /></>,
  agi: <path d="M13 2L5 14h6l-1 8 8-12h-6z" />,
  vit: <path d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z" />,
  int: <><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /><path d="M12 8v4l3 2" /></>,
  per: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  // nav
  status: <><rect x="4" y="3" width="16" height="18" rx="1" /><circle cx="12" cy="9" r="3" /><path d="M7 18c1-3 9-3 10 0" /></>,
  quests: <><path d="M6 3h11a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
  train: <><path d="M3 9v6M6 7v10M18 7v10M21 9v6" /><path d="M6 12h12" /></>,
  diet: <><path d="M3 12h18a9 9 0 01-18 0z" /><path d="M12 12c0-4 2-7 5-8M12 12c-1-3-3-5-6-5" /></>,
  system: <><rect x="4" y="4" width="6" height="6" /><rect x="14" y="4" width="6" height="6" /><rect x="4" y="14" width="6" height="6" /><rect x="14" y="14" width="6" height="6" /></>,
  // equipment
  barbell: <><path d="M2 12h20" /><path d="M5 8v8M8 6v12M16 6v12M19 8v8" /></>,
  dumbbell: <><path d="M8 12h8" /><rect x="4" y="8" width="4" height="8" rx="1" /><rect x="16" y="8" width="4" height="8" rx="1" /></>,
  kettlebell: <><path d="M9 8a3 3 0 016 0" /><path d="M7 11a5 5 0 1010 0l-1-3H8z" /></>,
  machine: <><rect x="4" y="3" width="6" height="18" /><path d="M10 7h8v4h-8M14 11v10" /></>,
  cable: <><circle cx="12" cy="4" r="2" /><path d="M12 6v10M8 20h8M12 16l-3 4M12 16l3 4" /></>,
  bodyweight: <><circle cx="12" cy="4" r="2" /><path d="M12 6v8M7 9h10M12 14l-4 7M12 14l4 7" /></>,
  band: <path d="M5 6c4 4 10 4 14 0M5 18c4-4 10-4 14 0M5 6v12M19 6v12" />,
  bench: <><path d="M3 10h18v3H3z" /><path d="M6 13v6M18 13v6" /></>,
  pullupBar: <><path d="M2 5h20M5 5v4M19 5v4" /><circle cx="12" cy="11" r="2" /><path d="M9 6l3 3 3-3M12 13v5" /></>,
  cardio: <><path d="M3 18h18" /><path d="M6 18l3-9h7l2 9" /><path d="M14 5l2 4" /></>,
  // quest types
  daily: <><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" /></>,
  penalty: <><path d="M12 3a7 7 0 00-7 7v3l2 2v3h10v-3l2-2v-3a7 7 0 00-7-7z" /><circle cx="9" cy="11" r="1.5" /><circle cx="15" cy="11" r="1.5" /><path d="M10 18v-2M14 18v-2" /></>,
  emergency: <><path d="M12 3L2 20h20z" /><path d="M12 10v4M12 17v.5" /></>,
  hidden: <><path d="M9 9a3 3 0 115 2c-1 1-2 1.5-2 3" /><path d="M12 18v.5" /><rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="3 3" /></>,
  job: <><path d="M4 20L16 8M20 20L8 8" /><path d="M14 4h6v6M10 4H4v6" /></>,
  trial: <><path d="M4 18l2-10 4 4 2-6 2 6 4-4 2 10z" /><path d="M4 21h16" /></>,
  dungeon: <><path d="M5 21V10a7 7 0 0114 0v11" /><path d="M9 21v-8a3 3 0 016 0v8M3 21h18" /></>,
  // items / economy
  gem: <><path d="M6 3h12l4 6-10 12L2 9z" /><path d="M2 9h20M9 3l3 18 3-18" /></>,
  gold: <><circle cx="12" cy="12" r="8" /><path d="M12 7v10M9 9.5h4.5a1.5 1.5 0 010 3h-3a1.5 1.5 0 000 3H15" /></>,
  key: <><circle cx="8" cy="15" r="4" /><path d="M11 12l9-9M16 7l3 3M14 9l2 2" /></>,
  potion: <><path d="M10 3h4M10 3v5L5 17a3 3 0 003 4h8a3 3 0 003-4l-5-9V3" /><path d="M7.5 14h9" /></>,
  scroll: <><path d="M7 4h11a2 2 0 010 4H7" /><path d="M7 4a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V8" /><path d="M9 12h6M9 16h4" /></>,
  shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />,
  trophy: <><path d="M8 4h8v6a4 4 0 01-8 0z" /><path d="M8 6H4a4 4 0 004 4M16 6h4a4 4 0 01-4 4M12 14v4M8 21h8" /></>,
  star: <path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.4 6.5 20.3l1-6.2L3 9.7l6.2-.9z" />,
  flame: <path d="M12 21a7 7 0 01-7-7c0-4 3-6 4-10 2 2 3 4 3 6 1-1 2-2 2-4 3 2 5 5 5 8a7 7 0 01-7 7z" />,
  crown: <><path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z" /></>,
  title: <><path d="M4 6h16v12H4z" /><path d="M8 10h8M8 14h5" /></>,
  shadow: <><path d="M12 3c-4 0-6 3-6 7v11l3-2 3 2 3-2 3 2V10c0-4-2-7-6-7z" /><path d="M9.5 10h.01M14.5 10h.01" strokeWidth="3" /></>,
  inventory: <><rect x="3" y="7" width="18" height="14" rx="1" /><path d="M8 7V4h8v3M3 12h18M11 12v3h2v-3" /></>,
  store: <><path d="M4 9l1-5h14l1 5" /><path d="M4 9v11h16V9M4 9h16" /><path d="M9 20v-6h6v6" /></>,
  // body / diet / tracking
  water: <path d="M12 3s-6 7-6 11a6 6 0 0012 0c0-4-6-11-6-11z" />,
  scale: <><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M8 10a5 5 0 018 0l-3 2" /></>,
  ruler: <><path d="M3 17L17 3l4 4L7 21z" /><path d="M7 13l2 2M10 10l2 2M13 7l2 2" /></>,
  camera: <><path d="M3 8h4l2-3h6l2 3h4v12H3z" /><circle cx="12" cy="13" r="4" /></>,
  barcode: <path d="M3 5v14M6 5v14M9 5v14M13 5v14M15 5v14M18 5v14M21 5v14" />,
  chart: <><path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 5-6" /></>,
  heatmap: <><rect x="3" y="3" width="5" height="5" /><rect x="10" y="3" width="5" height="5" /><rect x="17" y="3" width="4" height="5" /><rect x="3" y="10" width="5" height="5" /><rect x="10" y="10" width="5" height="5" /><rect x="3" y="17" width="5" height="4" /></>,
  photo: <><rect x="3" y="4" width="18" height="16" rx="1" /><circle cx="9" cy="10" r="2" /><path d="M3 18l5-5 4 4 3-3 6 6" /></>,
  pose: <><circle cx="12" cy="4" r="2" /><path d="M12 6v6l-4 9M12 12l4 9M7 9l5 1 5-1" /><circle cx="8" cy="21" r=".5" /><circle cx="16" cy="21" r=".5" /></>,
  readiness: <><path d="M3 12h4l2-5 4 10 2-5h6" /></>,
  moon: <path d="M20 14A8 8 0 1110 4a6 6 0 0010 10z" />,
  // actions
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  check: <path d="M4 12l5 5L20 6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  back: <path d="M15 5l-7 7 7 7" />,
  next: <path d="M9 5l7 7-7 7" />,
  down: <path d="M5 9l7 7 7-7" />,
  up: <path d="M5 15l7-7 7 7" />,
  play: <path d="M7 4l13 8-13 8z" />,
  pause: <path d="M7 4v16M17 4v16" />,
  timer: <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M9 2h6" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M16 16l5 5" /></>,
  filter: <path d="M3 5h18l-7 8v6l-4 2v-8z" />,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" /></>,
  swap: <path d="M7 4L3 8l4 4M3 8h14M17 12l4 4-4 4M21 16H7" />,
  flip: <><path d="M12 3v18" strokeDasharray="2 2" /><path d="M9 7L4 12l5 5zM15 7l5 5-5 5z" /></>,
  edit: <path d="M4 20h4L20 8l-4-4L4 16z" />,
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14" />,
  drag: <path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" strokeWidth="3" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="1" /><path d="M8 11V8a4 4 0 018 0v3" /></>,
  sound: <><path d="M4 9h4l5-4v14l-5-4H4z" /><path d="M16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11" /></>,
  mute: <><path d="M4 9h4l5-4v14l-5-4H4z" /><path d="M16 9l5 6M21 9l-5 6" /></>,
  download: <path d="M12 3v12M7 10l5 5 5-5M4 21h16" />,
  upload: <path d="M12 15V3M7 8l5-5 5 5M4 21h16" />,
  share: <><path d="M12 3v12M8 7l4-4 4 4" /><path d="M5 12v8h14v-8" /></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="1" /><path d="M4 16V4h12" /></>,
  log: <><path d="M4 5h16M4 10h16M4 15h10M4 20h7" /></>,
  more: <path d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth="3" />,
} as const

export type IconName = keyof typeof P
export const iconNames = Object.keys(P) as IconName[]

export function Icon({ name, size = 24, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {P[name]}
    </svg>
  )
}
