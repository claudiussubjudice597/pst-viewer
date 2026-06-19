/**
 * Persistent cache of OCR results, so an image is read only once: re-opening a
 * mailbox (or the same image shared across many emails, or across mailboxes)
 * reuses the stored text instead of running OCR again.
 *
 * Only the recognized TEXT is stored, keyed by a SHA-256 of the image bytes
 * (a stable, content-addressed key). Images and sharpened canvases are never
 * stored, so the cache stays tiny (a few KB of text per image at most). It
 * lives in IndexedDB on the user's device and is never uploaded; clear it any
 * time with `clearOcrCache()`.
 *
 * Every operation degrades gracefully to "no cache" (IndexedDB or WebCrypto
 * unavailable, private-mode quota errors, etc.), so OCR still works without it.
 */

const DB_NAME = 'pstv-ocr-cache'
const STORE = 'text'
const DB_VERSION = 1

let dbPromise: Promise<IDBDatabase | null> | null = null

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null)
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
  return dbPromise
}

/** SHA-256 hex of the image bytes; a stable content key, or null if unavailable. */
export async function hashImageBytes(bytes: ArrayBuffer): Promise<string | null> {
  try {
    if (typeof crypto === 'undefined' || !crypto.subtle) return null
    const digest = await crypto.subtle.digest('SHA-256', bytes)
    const view = new Uint8Array(digest)
    let hex = ''
    for (let i = 0; i < view.length; i++) hex += view[i].toString(16).padStart(2, '0')
    return hex
  } catch {
    return null
  }
}

/**
 * Cached OCR text for a content hash. Returns `undefined` when the image has
 * never been read; an empty string means "read, contained no text" (so we do
 * not OCR it again).
 */
export async function getCachedOcr(hash: string): Promise<string | undefined> {
  const db = await openDb()
  if (!db) return undefined
  return new Promise((resolve) => {
    try {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(hash)
      req.onsuccess = () => resolve(typeof req.result === 'string' ? req.result : undefined)
      req.onerror = () => resolve(undefined)
    } catch {
      resolve(undefined)
    }
  })
}

/** Store OCR text (possibly empty) for a content hash. Best-effort. */
export async function putCachedOcr(hash: string, text: string): Promise<void> {
  const db = await openDb()
  if (!db) return
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(text, hash)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
      tx.onabort = () => resolve()
    } catch {
      resolve()
    }
  })
}

/** Delete every cached OCR result. Best-effort. */
export async function clearOcrCache(): Promise<void> {
  const db = await openDb()
  if (!db) return
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
      tx.onabort = () => resolve()
    } catch {
      resolve()
    }
  })
}
