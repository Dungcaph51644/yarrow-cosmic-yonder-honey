import { useEffect, useState, type CSSProperties } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Sparkles } from "lucide-react";
import { gift } from "@/content/gift";
import { MemoryOrbit } from "@/components/gift/MemoryOrbit";
import { SecretPhotoExperience } from "@/components/gift/secret-photo-universe";
import "./ConfessionEffect.css";

export function OpenedGift({ shown, onFold }: { shown: boolean; onFold: () => void }) {
  const [secretOpen, setSecretOpen] = useState(false);
  const [secretExperienceOpen, setSecretExperienceOpen] = useState(false);
  const [burstFinished, setBurstFinished] = useState(false);
  const [typedTitle, setTypedTitle] = useState("");
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (!secretOpen || burstFinished) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setBurstFinished(true);
      return;
    }

    const timer = window.setTimeout(() => setBurstFinished(true), 2550);
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

  return (
    <main
      className={shown ? "story is-shown" : "story"}
      aria-hidden={secretExperienceOpen}
      inert={secretExperienceOpen}
    >
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

      <section className="block reflection-block stagger" aria-labelledby="reflection-title">
        <p className="section-label">{gift.reflection.label}</p>

        <h2 id="reflection-title" className="block-title">
          {gift.reflection.title}
        </h2>

        <blockquote className="reflection-card">
          <span className="reflection-mark" aria-hidden="true">
            “
          </span>
          <p>{gift.reflection.quote}</p>
          <footer>
            <span aria-hidden="true" />
            Từ lá thư em gửi chị
          </footer>
        </blockquote>
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
                {Array.from({ length: 96 }, (_, i) => {
                  const angle = i * 2.399;
                  const radius = 0.16 + Math.sqrt((i + 1) / 96) * 0.9;
                  const isHeart = i % 4 === 0;
                  const style = {
                    "--burst-x": `${Math.cos(angle) * radius * 70}vw`,
                    "--burst-y": `${Math.sin(angle) * radius * 64}vh`,
                    "--burst-delay": `${(i % 8) * 25}ms`,
                    "--burst-duration": `${1.65 + (i % 6) * 0.1}s`,
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
                    Dù câu trả lời của chị là gì, em vẫn tôn trọng cảm xúc của chị. ❤️
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

      <MemoryOrbit />

      <section className="secret-universe-entry" aria-label="Không gian ảnh bí mật">
        <button
          type="button"
          className="secret-universe-entry__button"
          onClick={() => setSecretExperienceOpen(true)}
        >
          <Sparkles aria-hidden="true" />
          <span>Thời không khoảnh khắc</span>
        </button>
      </section>

      <footer className="story-foot stagger">
        <p>{gift.editNote}</p>

        <button type="button" className="text-button text-button-quiet" onClick={onFold}>
          {gift.fold}
        </button>
      </footer>
      {secretExperienceOpen ? (
        <SecretPhotoExperience onClose={() => setSecretExperienceOpen(false)} />
      ) : null}
    </main>
  );
}
