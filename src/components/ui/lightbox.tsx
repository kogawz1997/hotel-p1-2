'use client';

import { useEffect, useCallback, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';

interface LightboxProps {
  images: { url: string; alt?: string }[];
  index: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export function Lightbox({ images, index, onClose, onNext, onPrev }: LightboxProps) {
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowRight') onNext();
    if (e.key === 'ArrowLeft') onPrev();
  }, [onClose, onNext, onPrev]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  if (!images[index]) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      onClick={onClose}>
      {/* Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <span className="text-white/50 text-sm">{index + 1} / {images.length}</span>
        <a href={images[index].url} download target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
          <Download className="h-4 w-4 text-white" />
        </a>
        <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
          <X className="h-4 w-4 text-white" />
        </button>
      </div>

      {/* Prev */}
      {images.length > 1 && (
        <button onClick={e => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10">
          <ChevronLeft className="h-5 w-5 text-white" />
        </button>
      )}

      {/* Image */}
      <img src={images[index].url} alt={images[index].alt || ''}
        className="max-w-[90vw] max-h-[85vh] object-contain select-none"
        onClick={e => e.stopPropagation()} />

      {/* Caption */}
      {images[index].alt && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
          {images[index].alt}
        </div>
      )}

      {/* Next */}
      {images.length > 1 && (
        <button onClick={e => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10">
          <ChevronRight className="h-5 w-5 text-white" />
        </button>
      )}

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 max-w-sm overflow-x-auto pb-2">
          {images.map((img, i) => (
            <button key={i} onClick={e => { e.stopPropagation(); /* parent handles via index */ }}
              className={`h-12 w-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${i === index ? 'border-white' : 'border-transparent opacity-50 hover:opacity-80'}`}>
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Hook for easy lightbox state
export function useLightbox(images: { url: string; alt?: string }[]) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  function openAt(i: number) { setIdx(i); setOpen(true); }
  function close() { setOpen(false); }
  function next() { setIdx(p => (p + 1) % images.length); }
  function prev() { setIdx(p => (p - 1 + images.length) % images.length); }

  const lightboxEl = open ? (
    <Lightbox images={images} index={idx} onClose={close} onNext={next} onPrev={prev} />
  ) : null;

  return { openAt, lightboxEl };
}
