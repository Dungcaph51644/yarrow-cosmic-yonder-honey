import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { bouquetPhotos, gift } from "@/content/gift";
import { playChime } from "@/lib/chime";
import { Atmosphere } from "@/components/gift/atmosphere";
import { FlowerBouquet } from "@/components/gift/FlowerBouquet";
import { GiftBox } from "@/components/gift/gift-box";
import { OpenedGift } from "@/components/gift/opened-gift";

type Phase = "sealed" | "opening" | "bouquet" | "open";

const OPEN_MS = 3600;

export function GiftExperience() {
  const [phase, setPhase] = useState<Phase>("sealed");
  const lock = useRef(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (new URLSearchParams(window.location.hash.slice(1)).has("space")) {
      setPhase("open");
    }
  }, []);

  useEffect(() => {
    if (phase === "bouquet" || phase === "open") {
      window.scrollTo(0, 0);
    }
  }, [phase]);

  function openGift() {
    if (lock.current) return;
    lock.current = true;
    setPhase("opening");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) playChime();
    timer.current = window.setTimeout(() => {
      setPhase("bouquet");
    }, OPEN_MS);
  }

  function fold() {
    if (timer.current !== null) window.clearTimeout(timer.current);
    lock.current = false;
    setPhase("sealed");
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openGift();
    }
  }

  const sealed = phase === "sealed" || phase === "opening";

  return (
    <div className="stage">
      <Atmosphere />
      <p className="sr-only" aria-live="polite">
        {phase === "bouquet" ? "Bó hoa kỷ niệm đang nở." : phase === "open" ? "Lá thư đã mở." : ""}
      </p>
      {phase === "bouquet" ? (
        <FlowerBouquet photos={bouquetPhotos} onContinue={() => setPhase("open")} />
      ) : null}
      {phase === "open" ? <OpenedGift shown onFold={fold} /> : null}
      {sealed ? (
        <div className={phase === "opening" ? "veil is-opening" : "veil"}>
          <div className="veil-copy">
            <h1 className="veil-title">{gift.intro.headline}</h1>
          </div>
          <div
            className="gift-hit"
            role="button"
            tabIndex={phase === "sealed" ? 0 : -1}
            aria-disabled={phase !== "sealed"}
            aria-label="Mở hộp quà"
            onClick={openGift}
            onKeyDown={onKeyDown}
          >
            <GiftBox opening={phase === "opening"} />
          </div>
          <p className="hint">{gift.intro.hint}</p>
        </div>
      ) : null}
    </div>
  );
}
