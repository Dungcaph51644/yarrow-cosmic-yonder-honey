import { useEffect, useState, type AnimationEvent, type CSSProperties } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { MemoryPhoto } from "@/content/gift";
import "./FlowerBouquet.css";

type FlowerPosition = {
  left: number;
  top: number;
};

const FLOWER_POSITIONS: FlowerPosition[] = [
  { left: 18, top: 38 },
  { left: 32, top: 22 },
  { left: 50, top: 34 },
  { left: 68, top: 22 },
  { left: 82, top: 38 },
  { left: 39, top: 51 },
  { left: 61, top: 51 },
  { left: 50, top: 10 },
];

export type FlowerBouquetProps = {
  photos: readonly MemoryPhoto[];
  onContinue: () => void;
  autoAdvanceMs?: number | null;
};

export function FlowerBouquet({ photos, onContinue, autoAdvanceMs = null }: FlowerBouquetProps) {
  const [bloomedCount, setBloomedCount] = useState(0);
  const [revealedPhotos, setRevealedPhotos] = useState<Set<number>>(() => new Set());
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxOrigin, setLightboxOrigin] = useState<{ x: number; y: number } | null>(null);
  const allFlowersShown = bloomedCount >= photos.length;
  const activePhoto = selectedPhoto === null ? null : (photos[selectedPhoto] ?? null);

  useEffect(() => {
    if (photos.length === 0) {
      setBloomedCount(0);
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setBloomedCount(photos.length);
      return;
    }

    setBloomedCount(0);
    let nextIndex = 0;
    let timer: number | undefined;

    function revealNextFlower() {
      nextIndex += 1;
      setBloomedCount(nextIndex);

      if (nextIndex < photos.length) {
        timer = window.setTimeout(revealNextFlower, 360);
      }
    }

    timer = window.setTimeout(revealNextFlower, 220);
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [photos.length]);

  useEffect(() => {
    if (!allFlowersShown || autoAdvanceMs === null || autoAdvanceMs === undefined) {
      return;
    }

    const timer = window.setTimeout(onContinue, Math.max(0, autoAdvanceMs));
    return () => window.clearTimeout(timer);
  }, [allFlowersShown, autoAdvanceMs, onContinue]);

  function positionForFlower(index: number): FlowerPosition {
    const preset = FLOWER_POSITIONS[index];
    if (preset) return preset;

    const extraIndex = index - FLOWER_POSITIONS.length;
    const angle = (extraIndex / Math.max(1, photos.length - FLOWER_POSITIONS.length)) * Math.PI;
    return {
      left: 50 + Math.cos(angle) * 37,
      top: 29 + Math.sin(angle) * 24,
    };
  }

  function revealOrOpenPhoto(index: number, flower: HTMLButtonElement) {
    if (!revealedPhotos.has(index)) {
      setRevealedPhotos((current) => new Set(current).add(index));
      return;
    }

    const bounds = flower.getBoundingClientRect();
    setLightboxOrigin({ x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 });
    setSelectedPhoto(index);
    setLightboxOpen(true);
  }

  function closeLightbox() {
    setLightboxOpen(false);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSelectedPhoto(null);
      setLightboxOrigin(null);
    }
  }

  function finishLightboxClose(event: AnimationEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget && event.animationName === "bouquet-lightbox-close") {
      setSelectedPhoto(null);
      setLightboxOrigin(null);
    }
  }

  return (
    <main className="bouquet-page">
      <section className="bouquet-card" aria-labelledby="bouquet-title">
        <div className="bouquet-glimmers" aria-hidden="true">
          {Array.from({ length: 18 }, (_, index) => (
            <span key={index} className={`bouquet-glimmer bouquet-glimmer-${index % 6}`} />
          ))}
        </div>

        <header className="bouquet-heading">
          <p className="bouquet-kicker">Một bó hoa dành riêng cho chị</p>
          <h1 id="bouquet-title">Tặng chị những điều dịu dàng</h1>
          <p className="bouquet-intro">Mỗi bông hoa là một khoảnh khắc em muốn giữ lại.</p>
        </header>

        <div
          className={`bouquet-art${allFlowersShown ? " is-complete" : ""}`}
          aria-label={`Bó hoa kỷ niệm, ${photos.length} bông hoa`}
        >
          <svg
            className="bouquet-stems"
            viewBox="0 0 1000 620"
            role="presentation"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="flower-stem-gradient" x1="0" x2="1">
                <stop offset="0" stopColor="#527b65" />
                <stop offset="0.48" stopColor="#a5b982" />
                <stop offset="1" stopColor="#547a62" />
              </linearGradient>
              <linearGradient id="flower-leaf-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#b6c88e" />
                <stop offset="0.48" stopColor="#789b73" />
                <stop offset="1" stopColor="#456c5b" />
              </linearGradient>
              <linearGradient id="flower-wrap-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#f4d8ec" stopOpacity="0.68" />
                <stop offset="0.5" stopColor="#c99bd9" stopOpacity="0.5" />
                <stop offset="1" stopColor="#f6d6d9" stopOpacity="0.76" />
              </linearGradient>
            </defs>
            {photos.map((_, index) => {
              const position = positionForFlower(index);
              const x = position.left * 10;
              const y = position.top * 5.6 + 42;
              const endX = 470 + (index % 7) * 10;
              const path = `M ${x} ${y} C ${x + (500 - x) * 0.18} ${y + 118}, ${endX + (x - endX) * 0.12} 440, ${endX} 520`;
              return (
                <g key={`stem-${index}`} className="bouquet-stem-group">
                  <path d={path} className="bouquet-stem-shadow" />
                  <path
                    d={path}
                    fill="none"
                    stroke="url(#flower-stem-gradient)"
                    strokeLinecap="round"
                    strokeWidth="3.5"
                    className="bouquet-stem"
                    style={{ transitionDelay: `${index * 90}ms` }}
                  />
                  <path
                    d={path}
                    className="bouquet-stem-highlight"
                    style={{ transitionDelay: `${index * 90}ms` }}
                  />
                </g>
              );
            })}
            <path
              d="M355 383 Q500 402 645 383 C610 426 565 475 530 510 Q500 524 470 510 C435 475 390 426 355 383Z"
              fill="url(#flower-wrap-gradient)"
              className="bouquet-wrap"
            />
            <path d="M355 383 Q500 402 645 383" className="bouquet-wrap-edge" />
            <path
              d="M405 389 Q444 452 478 510 M595 389 Q556 452 522 510 M500 402 L500 516"
              className="bouquet-wrap-fold"
            />
            <path
              d="M382 390 C345 335 292 345 314 390 C330 420 360 417 382 390Z"
              fill="url(#flower-leaf-gradient)"
              className="bouquet-leaf"
            />
            <path d="M382 390 Q344 372 314 360" className="bouquet-leaf-vein" />
            <path
              d="M618 410 C652 352 710 363 687 408 C670 436 640 435 618 410Z"
              fill="url(#flower-leaf-gradient)"
              className="bouquet-leaf bouquet-leaf-right"
            />
            <path d="M618 410 Q654 385 687 377" className="bouquet-leaf-vein" />
          </svg>

          <div className="bouquet-ribbon" aria-hidden="true">
            <span />
            <span />
          </div>

          {photos.length === 0 ? (
            <p className="bouquet-empty">Bó hoa đang chờ những bức ảnh xinh xắn.</p>
          ) : (
            photos.map((photo, index) => {
              const position = positionForFlower(index);
              const isVisible = index < bloomedCount;
              return (
                <button
                  key={`${photo.src}-${index}`}
                  type="button"
                  className={`bouquet-flower bouquet-flower-tilt-${index % FLOWER_POSITIONS.length}${isVisible ? " is-visible" : ""}${revealedPhotos.has(index) ? " is-photo-revealed" : ""}`}
                  style={{
                    left: `${position.left}%`,
                    top: `${position.top}%`,
                    transitionDelay: isVisible ? `${index * 70}ms` : "0ms",
                  }}
                  onClick={(event) => revealOrOpenPhoto(index, event.currentTarget)}
                  aria-label={
                    revealedPhotos.has(index)
                      ? `Phóng to ảnh: ${photo.caption}`
                      : `Chạm để mở hoa: ${photo.caption}`
                  }
                  disabled={!isVisible}
                  tabIndex={isVisible ? 0 : -1}
                  aria-hidden={!isVisible}
                >
                  <span className="bouquet-petals" aria-hidden="true">
                    {Array.from({ length: 10 }, (_, petal) => (
                      <span key={petal} className={`bouquet-petal bouquet-petal-${petal}`} />
                    ))}
                    <span className="bouquet-petal-core" />
                  </span>
                  <span
                    className={`bouquet-flower-center${revealedPhotos.has(index) ? " is-revealed" : ""}`}
                    aria-hidden="true"
                  >
                    {revealedPhotos.has(index) ? (
                      <img src={photo.src} alt="" loading="lazy" />
                    ) : (
                      <span className="bouquet-center-star">✦</span>
                    )}
                  </span>
                  <span className="bouquet-photo-caption">{photo.caption}</span>
                  <span className="bouquet-reveal-sparkles" aria-hidden="true">
                    {Array.from({ length: 8 }, (_, sparkle) => (
                      <span key={sparkle} />
                    ))}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <footer className="bouquet-footer">
          <p className="bouquet-hint" aria-live="polite">
            {allFlowersShown
              ? "Chạm vào từng bông để hé lộ ảnh, rồi chạm ảnh để phóng to."
              : "Từng bông hoa đang khẽ nở dành cho em…"}
          </p>
          <button
            className="bouquet-continue"
            type="button"
            onClick={onContinue}
            disabled={!allFlowersShown}
          >
            Tiếp tục đến lá thư
            <span aria-hidden="true">♡</span>
          </button>
        </footer>
      </section>

      <Dialog.Root
        open={lightboxOpen}
        onOpenChange={(open) => {
          if (open) setLightboxOpen(true);
          else closeLightbox();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="bouquet-lightbox-overlay" />
          <Dialog.Content
            className="bouquet-lightbox"
            onAnimationEnd={finishLightboxClose}
            style={
              lightboxOrigin
                ? ({
                    "--bouquet-origin-x": `${lightboxOrigin.x}px`,
                    "--bouquet-origin-y": `${lightboxOrigin.y}px`,
                  } as CSSProperties)
                : undefined
            }
          >
            {activePhoto ? (
              <>
                <Dialog.Close className="bouquet-lightbox-close" aria-label="Đóng ảnh">
                  <X aria-hidden="true" />
                </Dialog.Close>
                <Dialog.Title className="bouquet-lightbox-title">
                  {activePhoto.caption}
                </Dialog.Title>
                <Dialog.Description className="sr-only">{activePhoto.alt}</Dialog.Description>
                <img src={activePhoto.src} alt={activePhoto.alt} />
              </>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
}
