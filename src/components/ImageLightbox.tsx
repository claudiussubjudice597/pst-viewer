import { useEffect, useState } from 'react'
import { Close } from './icons'

/**
 * Full-screen image viewer. Opens fit-to-screen; click the image to zoom in
 * (enlarged so small text is readable, even for images smaller than the screen)
 * and scroll to pan. Click again to fit. Close with the X, the backdrop, or Escape.
 */
export function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  const [zoomed, setZoomed] = useState(false)
  const [natural, setNatural] = useState(0)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 overflow-auto bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="fixed right-4 top-4 z-10 rounded-full bg-slate-800/80 p-2 text-slate-200 transition hover:bg-slate-700"
        data-tip="Close (Esc)"
      >
        <Close className="h-5 w-5" />
      </button>
      <div className="flex min-h-full w-max min-w-full items-center justify-center p-4">
        <img
          src={src}
          alt=""
          onLoad={(e) => setNatural(e.currentTarget.naturalWidth)}
          onClick={(e) => {
            e.stopPropagation()
            setZoomed((z) => !z)
          }}
          className={
            zoomed
              ? 'h-auto max-w-none cursor-zoom-out'
              : 'max-h-[88vh] max-w-[92vw] cursor-zoom-in object-contain'
          }
          // Zoom to at least 1.6x the screen width so it always visibly enlarges,
          // and to the image's full resolution when that is larger.
          style={zoomed ? { width: `max(${natural || 0}px, 160vw)` } : undefined}
        />
      </div>
    </div>
  )
}
