// Recharts wrappers themed to the System look (DESIGN.md §8): mono ticks, glowing line, minimal grid.
import { Bar, BarChart as RBarChart, CartesianGrid, Line, LineChart as RLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { EmptyState } from './feedback'

const tick = { fill: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 11 }
const tooltip = { contentStyle: { background: 'var(--panel-solid)', border: '1px solid var(--line)', borderRadius: 2, fontFamily: 'var(--font-mono)', fontSize: 12 }, labelStyle: { color: 'var(--text-dim)' }, itemStyle: { color: 'var(--text)' } }

type Point = Record<string, number | string>

export function LineChart({ data, x, y, color = 'var(--glow)', height = 180, empty = '[No data has been recorded yet.]', unit }: { data: Point[]; x: string; y: string; color?: string; height?: number; empty?: string; unit?: string }) {
  if (!data.length) return <EmptyState message={empty} icon="chart" />
  return (
    <div style={{ height }} role="img" aria-label={`${y} over ${x}, ${data.length} points`}>
      <ResponsiveContainer>
        <RLineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="rgb(47 168 255 / .08)" vertical={false} />
          <XAxis dataKey={x} tick={tick} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis tick={tick} axisLine={false} tickLine={false} unit={unit} width={52} domain={['auto', 'auto']} />
          <Tooltip {...tooltip} />
          <Line type="monotone" dataKey={y} stroke={color} strokeWidth={2} dot={{ r: 2, fill: color }} style={{ filter: `drop-shadow(0 0 4px ${color})` }} isAnimationActive={false} />
        </RLineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function BarChart({ data, x, y, color = 'var(--system-blue)', height = 180, empty = '[No data has been recorded yet.]' }: { data: Point[]; x: string; y: string; color?: string; height?: number; empty?: string }) {
  if (!data.length) return <EmptyState message={empty} icon="chart" />
  return (
    <div style={{ height }} role="img" aria-label={`${y} by ${x}`}>
      <ResponsiveContainer>
        <RBarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="rgb(47 168 255 / .08)" vertical={false} />
          <XAxis dataKey={x} tick={tick} axisLine={false} tickLine={false} />
          <YAxis tick={tick} axisLine={false} tickLine={false} width={44} />
          <Tooltip {...tooltip} cursor={{ fill: 'rgb(47 168 255 / .06)' }} />
          <Bar dataKey={y} fill={color} radius={[2, 2, 0, 0]} isAnimationActive={false} />
        </RBarChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Rows × columns heatmap (e.g. weekly sets per muscle). Values 0..max. */
export function Heatmap({ rows, cols, values, max, label }: { rows: string[]; cols: string[]; values: number[][]; max: number; label: string }) {
  if (!rows.length) return <EmptyState message="[No data has been recorded yet.]" icon="heatmap" />
  return (
    <table className="w-full border-separate border-spacing-0.5" aria-label={label}>
      <thead>
        <tr><th />{cols.map((c) => <th key={c} className="t-small font-normal text-dim">{c}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r}>
            <th scope="row" className="t-small pr-2 text-left font-normal text-dim">{r}</th>
            {cols.map((c, j) => {
              const v = values[i]?.[j] ?? 0
              return (
                <td key={c} title={`${r} ${c}: ${v}`} className="t-num h-7 text-center text-[11px]" style={{ background: `rgb(47 168 255 / ${0.06 + 0.8 * Math.min(1, v / max)})`, color: v / max > 0.86 ? 'var(--text-on-accent)' : 'var(--text)' }}>
                  {v || ''}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
