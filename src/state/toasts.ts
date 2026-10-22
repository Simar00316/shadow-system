import { create } from 'zustand'

export type ToastKind = 'info' | 'success' | 'warning' | 'reward' | 'shadow'
export type Toast = { id: number; kind: ToastKind; text: string }

let next = 1

export const useToasts = create<{ toasts: Toast[]; push: (kind: ToastKind, text: string) => number; dismiss: (id: number) => void }>((set) => ({
  toasts: [],
  push: (kind, text) => {
    const id = next++
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, kind, text }] }))
    return id
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
