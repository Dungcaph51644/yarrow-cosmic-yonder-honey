import { useEffect, useState, type CSSProperties } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { gift } from "@/content/gift";
import "./ConfessionEffect.css";

export function OpenedGift({ shown, onFold }: { shown: boolean; onFold: () => void }) {
  const [photo, setPhoto] = useState<number | null>(null);
  const active = photo === null ? null : gift.album.photos[photo];

  const [secretOpen, setSecretOpen] = useState(false);
  const [burstFinished, setBurstFinished] = useState(false);
  const [typedTitle, setTypedTitle] = useState("");
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (!secretOpen || burstFinished) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setBurstFinished(true);
      return;
    }

    const timer = window.setTimeout(() => setBurstFinished(true), 2300);
    return () => window.clearTimeout(timer);
  }, [secretOpen, burstFinished]);

  useEffect(() => {
    if (!secretOpen || !burstFinished) return;

    const title = gift.secret.title;
    let index = 0;
    let messageTimer: number | undefined;

    setTypedTitle("");
    setShowMessage(false);

    const typingTimer = window.setInterval(() => {
      index += 1;
      setTypedTitle(title.slice(0, index));

      if (index >= title.length) {
        window.clearInterval(typingTimer);

        messageTimer = window.setTimeout(() => {
          setShowMessage(true);
        }, 450);
      }
    }, 100);

    return () => {
      window.clearInterval(typingTimer);
      if (messageTimer !== undefined) window.clearTimeout(messageTimer);
    };
  }, [secretOpen, burstFinished]);

  function handleSecretChange(open: boolean) {
    setSecretOpen(open);

    if (open) {
      setBurstFinished(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      setTypedTitle("");
      setShowMessage(false);
    }
  }

  function step(dir: -1 | 1) {
    setPhoto((current) => {
      if (current === null) return current;

      const next = current + dir;

      if (next < 0 || next >= gift.album.photos.length) {
        return current;
      }

      return next;
    });
  }

  return (
    <main className={shown ? "story is-shown" : "story"}>
      <header className="story-hero stagger">
        <p className="section-label">{gift.story.kicker}</p>
        <h1 className="story-title">{gift.story.title}</h1>
        <p className="lede">{gift.story.lede}</p>
      </header>

      <article className="sheet stagger">
        <p className="greeting">{gift.letter.greeting}</p>

        {gift.letter.paragraphs.map((paragraph) => (
          <p key={paragraph} className="letter-p">
            {paragraph}
          </p>
        ))}

        <p className="signoff">{gift.letter.signoff}</p>
      </article>

      <section className="block stagger" aria-labelledby="album-title">
        <p className="section-label">{gift.album.label}</p>

        <h2 id="album-title" className="block-title">
          {gift.album.title}
        </h2>

        <p className="note">{gift.album.note}</p>

        <ul className="album">
          {gift.album.photos.map((item, index) => (
            <li key={item.src}>
              <button type="button" className="photo-btn" onClick={() => setPhoto(index)}>
                <img
                  className="photo-frame"
                  src={item.src}
                  alt={item.alt}
                  width={900}
                  height={1200}
                  loading="lazy"
                  decoding="async"
                />
                <span className="caption">{item.caption}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="block stagger" aria-labelledby="timeline-title">
        <p className="section-label">{gift.timeline.label}</p>

        <h2 id="timeline-title" className="block-title">
          {gift.timeline.title}
        </h2>

        <ol className="timeline">
          {gift.timeline.moments.map((moment) => (
            <li key={moment.title} className="moment">
              <p className="when">{moment.when}</p>
              <h3 className="moment-title">{moment.title}</h3>
              <p className="moment-body">{moment.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="block secret-block stagger">
        <Dialog.Root open={secretOpen} onOpenChange={handleSecretChange}>
          <Dialog.Trigger className="text-button">{gift.secret.button}</Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Overlay className="dialog-overlay confession-overlay" />

            {!burstFinished && (
              <div className="confession-burst" aria-hidden="true">
                {Array.from({ length: 64 }, (_, i) => {
                  const angle = i * 2.399;
                  const radius = 0.3 + ((i * 7) % 8) * 0.1;
                  const isHeart = i % 4 === 0;
                  const style = {
                    "--burst-x": `${Math.cos(angle) * radius * 110}vw`,
                    "--burst-y": `${Math.sin(angle) * radius * 95}vh`,
                    "--burst-delay": `${(i % 8) * 35}ms`,
                    "--burst-duration": `${1.5 + (i % 5) * 0.13}s`,
                    "--burst-spin": `${i * 31}deg`,
                    "--burst-size": `${16 + (i % 5) * 5}px`,
                  } as CSSProperties;

                  return (
                    <span
                      key={i}
                      className={`confession-burst-particle${isHeart ? " is-heart" : " is-petal"}`}
                      style={style}
                    >
                      {isHeart ? (i % 2 === 0 ? "♥" : "♡") : null}
                    </span>
                  );
                })}
              </div>
            )}

            <Dialog.Content
              className={`dialog-card confession-dialog${burstFinished ? " is-revealed" : " is-bursting"}`}
              aria-label={gift.secret.button}
            >
              <div className="confession-hearts" aria-hidden="true">
                {Array.from({ length: 28 }, (_, i) => (
                  <span
                    key={i}
                    className="confession-heart"
                    style={{
                      left: `${(i * 37 + 7) % 100}%`,
                      animationDelay: `${(i % 10) * 0.2}s`,
                      animationDuration: `${3.2 + (i % 5) * 0.45}s`,
                      fontSize: `${16 + (i % 4) * 8}px`,
                    }}
                  >
                    {i % 3 === 0 ? "♥" : i % 3 === 1 ? "♡" : "❤"}
                  </span>
                ))}
              </div>

              <div className="confession-inner" aria-hidden={!burstFinished}>
                <p className="section-label">Giấu trong hộp</p>

                <Dialog.Title className="block-title confession-title">
                  {typedTitle}
                  <span className="confession-cursor" aria-hidden="true">
                    |
                  </span>
                </Dialog.Title>

                {showMessage && (
                  <Dialog.Description className="secret-copy confession-message">
                    {gift.secret.message}
                  </Dialog.Description>
                )}

                {showMessage && (
                  <p className="confession-note">
                    Dù câu trả lời của em là gì, anh vẫn tôn trọng cảm xúc của em. ❤️
                  </p>
                )}

                <Dialog.Close className="text-button text-button-quiet confession-close">
                  {gift.secret.close}
                </Dialog.Close>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </section>

      <footer className="story-foot stagger">
        <p>{gift.editNote}</p>

        <button type="button" className="text-button text-button-quiet" onClick={onFold}>
          {gift.fold}
        </button>
      </footer>

      <Dialog.Root open={photo !== null} onOpenChange={(open) => !open && setPhoto(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />

          <Dialog.Content className="dialog-card photo-dialog">
            {active ? (
              <>
                <Dialog.Title className="sr-only">{active.caption}</Dialog.Title>

                <Dialog.Description className="sr-only">{active.alt}</Dialog.Description>

                <img
                  className="lightbox-img"
                  src={active.src}
                  alt={active.alt}
                  width={900}
                  height={1200}
                />

                <p className="caption lightbox-caption">{active.caption}</p>

                <div className="lightbox-nav">
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => step(-1)}
                    disabled={photo === 0}
                  >
                    <ChevronLeft aria-hidden="true" />
                    <span className="sr-only">Ảnh trước</span>
                  </button>

                  <Dialog.Close className="icon-button">
                    <X aria-hidden="true" />
                    <span className="sr-only">Đóng ảnh</span>
                  </Dialog.Close>

                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => step(1)}
                    disabled={photo === gift.album.photos.length - 1}
                  >
                    <ChevronRight aria-hidden="true" />
                    <span className="sr-only">Ảnh sau</span>
                  </button>
                </div>
              </>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
}
