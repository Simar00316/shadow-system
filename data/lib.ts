// Shared helpers for the build-time data scripts. Downloads are cached in data/.cache (gitignored).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

export const SOURCES = JSON.parse(readFileSync('data/sources.lock.json', 'utf8')) as Record<string, { repo?: string; sha?: string; url?: string; license: string }>

export const raw = (key: string, path: string) => {
  const s = SOURCES[key]
  return `https://raw.githubusercontent.com/${s.repo}/${s.sha}/${path}`
}

/** Fetch a URL once; later runs read the cached copy. */
export async function cached(url: string, file: string): Promise<Buffer> {
  if (existsSync(file)) return readFileSync(file)
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url)
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer())
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, buf)
      return buf
    }
    if (attempt >= 4 || res.status === 404) throw new Error(`${res.status} ${url}`)
    await new Promise((r) => setTimeout(r, 1000 * attempt))
  }
}

/** Run async jobs with bounded concurrency. */
export async function pool<T>(items: T[], n: number, fn: (item: T, i: number) => Promise<void>) {
  let next = 0
  await Promise.all(Array.from({ length: n }, async () => {
    while (next < items.length) { const i = next++; await fn(items[i], i) }
  }))
}

/** Minimal RFC 4180 CSV parser (quoted fields, embedded commas/newlines). */
export function parseCsv(text: string, delimiter = ','): string[][] {
  const rows: string[][] = []
  let row: string[] = [], field = '', q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++ } else q = false } else field += c
    } else if (c === '"') q = true
    else if (c === delimiter) { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field); rows.push(row); row = []; field = ''
    } else field += c
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  return rows
}

export const writeJson = (file: string, data: unknown) => {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, JSON.stringify(data))
}
