import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowRight, Sparkles, X } from "lucide-react";
import { orbitPhotos } from "@/content/gift";
import "./MemoryOrbit.css";

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  startTime: number;
  dragging: boolean;
};

const ORBIT_DURATION = 32_000;
const PHOTO_OPEN_DELAY = 1_000;

export function MemoryOrbit() {
  const [rotation, setRotation] = useState(0);
  const [flashingPhoto, setFlashingPhoto] = useState<number | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const orbitTrack = useRef<HTMLDivElement>(null);
  const orbitAnimation = useRef<Animation | null>(null);
  const starAnimations = useRef<Animation[]>([]);
  const drag = useRef<DragState | null>(null);
  const photoOpenTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const photos = orbitPhotos;
  const activePhoto = selectedPhoto === null ? null : (photos[selectedPhoto] ?? null);

  useEffect(
    () => () => {
      if (photoOpenTimeout.current !== null) clearTimeout(photoOpenTimeout.current);
    },
    [],
  );

  useEffect(() => {
    const track = orbitTrack.current;
    const stage = track?.parentElement;
    const rings = stage?.querySelector<HTMLElement>(".memory-orbit__rings");
    if (!track || !stage || !rings) return;

    const updateOrbitPath = () => {
      const trackBounds = track.getBoundingClientRect();
      const ringBounds = rings.getBoundingClientRect();
      const rx = (ringBounds.width / trackBounds.width) * 50;
      const ry = (ringBounds.height / trackBounds.height) * 50;
      const centerX =
        ((ringBounds.left + ringBounds.width / 2 - trackBounds.left) / trackBounds.width) * 100;
      const centerY =
        ((ringBounds.top + ringBounds.height / 2 - trackBounds.top) / trackBounds.height) * 100;

      track.style.setProperty("--orbit-path", `ellipse(${rx}% ${ry}% at ${centerX}% ${centerY}%)`);
    };

    updateOrbitPath();
    const resizeObserver = new ResizeObserver(updateOrbitPath);
    resizeObserver.observe(stage);
    resizeObserver.observe(rings);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return () => resizeObserver.disconnect();
    }

    const timing: KeyframeAnimationOptions = {
      duration: ORBIT_DURATION,
      iterations: Infinity,
      easing: "linear",
    };
    const animation = track.animate([{ opacity: 1 }, { opacity: 1 }], timing);
    const stars = Array.from(track.querySelectorAll<HTMLElement>(".memory-orbit__star"));
    const animations = stars.map((star, index) => {
      const phase = index / stars.length;
      const starAnimation = star.animate(
        [{ offsetDistance: "0%" }, { offsetDistance: "100%" }],
        timing,
      );
      starAnimation.currentTime = phase * ORBIT_DURATION;
      return starAnimation;
    });
    orbitAnimation.current = animation;
    starAnimations.current = animations;

    return () => {
      animation.cancel();
      animations.forEach((starAnimation) => starAnimation.cancel());
      orbitAnimation.current = null;
      starAnimations.current = [];
      resizeObserver.disconnect();
    };
  }, []);

  function setOrbitTime(currentTime: number) {
    if (!orbitAnimation.current) return;
    orbitAnimation.current.currentTime = currentTime;
    starAnimations.current.forEach((animation, index) => {
      animation.currentTime =
        currentTime + (index / starAnimations.current.length) * ORBIT_DURATION;
    });
  }

  function rotateOrbit(degrees: number) {
    const animation = orbitAnimation.current;
    if (animation && typeof animation.currentTime === "number") {
      setOrbitTime(animation.currentTime + (degrees / 360) * ORBIT_DURATION);
      return;
    }

    setRotation((current) => current + degrees);
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.target instanceof Element && event.target.closest("button")) return;
    if (!event.isPrimary) return;

    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startTime:
        typeof orbitAnimation.current?.currentTime === "number"
          ? orbitAnimation.current.currentTime
          : (rotation / 360) * ORBIT_DURATION,
      dragging: false,
    };
  }

  function moveOrbit(event: PointerEvent<HTMLDivElement>) {
    const activeDrag = drag.current;
    if (!activeDrag || activeDrag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - activeDrag.startX;
    const deltaY = event.clientY - activeDrag.startY;

    if (!activeDrag.dragging) {
      if (Math.abs(deltaX) < 5 || Math.abs(deltaX) < Math.abs(deltaY)) return;
      activeDrag.dragging = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    event.preventDefault();
    const animation = orbitAnimation.current;
    if (animation) {
      setOrbitTime(activeDrag.startTime + deltaX * 0.65 * (ORBIT_DURATION / 360));
    } else {
      setRotation(activeDrag.startTime * (360 / ORBIT_DURATION) + deltaX * 0.65);
    }
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function rotateWithKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      rotateOrbit(event.key === "ArrowLeft" ? -18 : 18);
    }
  }

  function revealPhoto(index: number) {
    if (photoOpenTimeout.current !== null) clearTimeout(photoOpenTimeout.current);
    setFlashingPhoto(index);
    photoOpenTimeout.current = setTimeout(() => {
      setSelectedPhoto(index);
      setFlashingPhoto(null);
      photoOpenTimeout.current = null;
    }, PHOTO_OPEN_DELAY);
  }

  return (
    <section className="memory-orbit" aria-labelledby="memory-orbit-title">
      <header className="memory-orbit__heading">
        <p className="section-label">Một góc trời dành riêng cho chị</p>
        <h2 className="block-title" id="memory-orbit-title">
          Quỹ đạo kỷ niệm
        </h2>
        <p className="memory-orbit__intro">
          Những nơi chốn và khoảnh khắc thân quen khẽ xoay quanh Huệ. Kéo để đổi hướng, hoặc chạm
          vào một vì sao để ngắm nhìn gần hơn.
        </p>
      </header>

      <div
        className="memory-orbit__stage"
        role="group"
        tabIndex={0}
        aria-label="Quỹ đạo kỷ niệm tự xoay 360 độ. Kéo ngang hoặc dùng phím mũi tên để xoay."
        onKeyDown={rotateWithKeyboard}
        onPointerDown={startDrag}
        onPointerMove={moveOrbit}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div className="memory-orbit__plane">
          <div className="memory-orbit__rings" aria-hidden="true">
            <span className="memory-orbit__orbiting-light" />
          </div>
        </div>

        <div ref={orbitTrack} className="memory-orbit__track">
          {photos.map((photo, index) => {
            const phase = (((index / photos.length + rotation / 360) % 1) + 1) % 1;
            const position = {
              "--star-delay": `${index * -0.48}s`,
              offsetDistance: orbitAnimation.current ? undefined : `${phase * 100}%`,
            } as CSSProperties;

            return (
              <button
                key={photo.src}
                type="button"
                className={`memory-orbit__star${flashingPhoto === index ? " is-flashing" : ""}`}
                style={position}
                aria-label={`Mở ảnh: ${photo.caption}`}
                aria-busy={flashingPhoto === index}
                onClick={() => revealPhoto(index)}
              >
                <span className="memory-orbit__star-face">
                  <span
                    className={`memory-orbit__flash${flashingPhoto === index ? " is-active" : ""}`}
                    aria-hidden="true"
                  />
                  <span className="memory-orbit__photo-wrap">
                    <img src={photo.src} alt="" loading="lazy" decoding="async" />
                  </span>
                  <span className="memory-orbit__caption">{photo.caption}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="memory-orbit__center" aria-hidden="true">
          <Sparkles />
          <span>Huệ</span>
          <small>trong những ngày dịu dàng</small>
        </div>
      </div>

      <div className="memory-orbit__controls" aria-label="Điều khiển quỹ đạo">
        <button
          type="button"
          className="memory-orbit__control"
          aria-label="Xoay quỹ đạo sang trái"
          onClick={() => rotateOrbit(-18)}
        >
          <ArrowLeft aria-hidden="true" />
        </button>
        <p>Kéo để xoay</p>
        <button
          type="button"
          className="memory-orbit__control"
          aria-label="Xoay quỹ đạo sang phải"
          onClick={() => rotateOrbit(18)}
        >
          <ArrowRight aria-hidden="true" />
        </button>
      </div>

      <Dialog.Root
        open={selectedPhoto !== null}
        onOpenChange={(open) => !open && setSelectedPhoto(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay memory-orbit__overlay" />
          <Dialog.Content className="dialog-card memory-orbit__dialog">
            {activePhoto ? (
              <>
                <Dialog.Title className="memory-orbit__dialog-title">
                  {activePhoto.caption}
                </Dialog.Title>
                <Dialog.Description className="sr-only">{activePhoto.alt}</Dialog.Description>
                <div className="memory-orbit__photo-frame">
                  <img
                    className="memory-orbit__large-photo"
                    src={activePhoto.src}
                    alt={activePhoto.alt}
                  />
                </div>
                <p className="memory-orbit__dialog-caption">{activePhoto.caption}</p>
                <Dialog.Close className="memory-orbit__close" aria-label="Đóng ảnh">
                  <X aria-hidden="true" />
                </Dialog.Close>
              </>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
