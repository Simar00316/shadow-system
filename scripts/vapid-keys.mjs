// Generate a VAPID key pair (P-256) and an API token for the push Worker. Prints values; stores nothing.
// Keep the pair forever: changing it breaks every existing subscription (Apple VapidPkHashMismatch).
const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
const pub = Buffer.from(await crypto.subtle.exportKey('raw', kp.publicKey)).toString('base64url')
const { d } = await crypto.subtle.exportKey('jwk', kp.privateKey)
const token = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url')
console.log(`VAPID_PUBLIC_KEY=${pub}\nVAPID_PRIVATE_KEY=${d}\nAPI_TOKEN=${token}`)
