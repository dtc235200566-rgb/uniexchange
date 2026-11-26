import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { resolveImageUrl } from '../lib/format';

export default function ImageSlider({ images = [], title = '' }) {
  const normalized = images.length > 0 ? images : [null];
  const [activeIndex, setActiveIndex] = useState(0);

  const prevSlide = () => {
    setActiveIndex((idx) => (idx === 0 ? normalized.length - 1 : idx - 1));
  };

  const nextSlide = () => {
    setActiveIndex((idx) => (idx === normalized.length - 1 ? 0 : idx + 1));
  };

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
        <img
          src={resolveImageUrl(normalized[activeIndex])}
          alt={`${title} - ảnh ${activeIndex + 1}`}
          className="h-full w-full object-cover"
        />
        {normalized.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Ảnh trước"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-800 shadow hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Ảnh tiếp theo"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-800 shadow hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-slate-900/75 px-2.5 py-1 text-xs font-medium text-white">
              {activeIndex + 1} / {normalized.length}
            </span>
          </>
        )}
      </div>

      {normalized.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {normalized.map((img, idx) => (
            <button
              key={`${img}-${idx}`}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                idx === activeIndex ? 'border-blue-600' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={resolveImageUrl(img)}
                alt={`Thumbnail ${idx + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
