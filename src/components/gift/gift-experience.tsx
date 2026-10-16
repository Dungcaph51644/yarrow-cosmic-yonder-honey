import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { gift } from "@/content/gift";
import { playChime } from "@/lib/chime";
import { Atmosphere } from "@/components/gift/atmosphere";
import { GiftBox } from "@/components/gift/gift-box";
import { OpenedGift } from "@/components/gift/opened-gift";

type Phase = "sealed" | "opening" | "open";

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

  function openGift() {
    if (lock.current) return;
    lock.current = true;
    setPhase("opening");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) playChime();
    timer.current = window.setTimeout(() => {
      setPhase("open");
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

  const sealed = phase !== "open";

  return (
    <div className="stage">
      <Atmosphere />
      <p className="sr-only" aria-live="polite">
        {phase === "open" ? "Hộp quà đã mở." : ""}
      </p>
      {phase !== "sealed" ? <OpenedGift shown={phase === "open"} onFold={fold} /> : null}
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
