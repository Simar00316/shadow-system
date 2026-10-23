/// <reference lib="webworker" />
// Web push handler (research/platform.md §1). iOS requires a visible notification for every push.
// The Worker sends either a Declarative Web Push payload (iOS 18.4+, shown by the OS) or {title, body, tag, url}.

export function registerPush(sw: ServiceWorkerGlobalScope) {
  sw.addEventListener('push', (event) => {
    let data: { title?: string; body?: string; tag?: string; url?: string; navigate?: string; notification?: { title: string; body?: string; navigate?: string; tag?: string } }
    try { data = event.data?.json() ?? {} } catch { data = { body: event.data?.text() } }
    const n = data.notification ?? { title: data.title ?? 'Shadow System', body: data.body, navigate: data.url, tag: data.tag }
    n.navigate ??= data.navigate
    event.waitUntil(sw.registration.showNotification(n.title, { body: n.body ?? '[A new message from the System.]', tag: n.tag, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', data: { url: n.navigate ?? '/' } }))
  })

  sw.addEventListener('notificationclick', (event) => {
    event.notification.close()
    const url = (event.notification.data as { url?: string } | null)?.url ?? '/'
    event.waitUntil((async () => {
      const wins = await sw.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const w = wins[0] as WindowClient | undefined
      if (w) { await w.focus(); await w.navigate(url).catch(() => undefined); return }
      await sw.clients.openWindow(url)
    })())
  })
}
