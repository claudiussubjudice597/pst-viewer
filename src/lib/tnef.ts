// Minimal parser for TNEF (Transport Neutral Encapsulation Format), the
// proprietary "winmail.dat" Outlook sometimes wraps a message in. It recovers
// the real attachments and a plain-text body; the RTF/MAPI-stream body is not
// decoded here (rare in practice, and the attachments are the high-value part).

export interface TnefAttachment {
  name: string
  mime: string
  data: ArrayBuffer
}

export interface TnefResult {
  bodyText: string | null
  attachments: TnefAttachment[]
}

const SIGNATURE = 0x223e9f78

// Low 16 bits of the 4-byte attribute id.
const ATT_BODY = 0x800c
const ATT_ATTACH_RENDDATA = 0x9002
const ATT_ATTACH_TITLE = 0x8010
const ATT_ATTACH_DATA = 0x800f

const decodeString = (data: ArrayBuffer): string =>
  new TextDecoder('latin1')
    .decode(new Uint8Array(data))
    .replace(/\0+$/, '')
    .trim()

/** Parse a winmail.dat byte stream, or return null if it is not valid TNEF. */
export function parseTnef(buf: ArrayBuffer): TnefResult | null {
  if (buf.byteLength < 6) return null
  const dv = new DataView(buf)
  if (dv.getUint32(0, true) !== SIGNATURE) return null

  const result: TnefResult = { bodyText: null, attachments: [] }
  let cur: TnefAttachment | null = null
  const flush = () => {
    if (cur && cur.data.byteLength > 0) result.attachments.push(cur)
    cur = null
  }
  const ensure = (): TnefAttachment => (cur ??= { name: '', mime: '', data: new ArrayBuffer(0) })

  let off = 6 // signature (4) + key (2)
  while (off + 9 <= buf.byteLength) {
    const level = dv.getUint8(off)
    const attr = dv.getUint32(off + 1, true)
    const len = dv.getUint32(off + 5, true)
    off += 9
    if (len < 0 || off + len + 2 > buf.byteLength) break
    const data = buf.slice(off, off + len)
    off += len + 2 // data + 2-byte checksum
    const id = attr & 0xffff

    if (level === 1) {
      if (id === ATT_BODY && !result.bodyText) result.bodyText = decodeString(data) || null
    } else if (level === 2) {
      if (id === ATT_ATTACH_RENDDATA) {
        flush()
        cur = { name: '', mime: '', data: new ArrayBuffer(0) }
      } else if (id === ATT_ATTACH_TITLE) {
        ensure().name = decodeString(data)
      } else if (id === ATT_ATTACH_DATA) {
        ensure().data = data
      }
    }
  }
  flush()
  return result
}
