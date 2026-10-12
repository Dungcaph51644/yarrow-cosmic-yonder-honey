import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { gift } from "@/content/gift";

export function OpenedGift({
  shown,
  onFold,
}: {
  shown: boolean;
  onFold: () => void;
}) {
  const [photo, setPhoto] = useState<number | null>(null);
  const active = photo === null ? null : gift.album.photos[photo];

  function step(dir: -1 | 1) {
    setPhoto((current) => {
      if (current === null) return current;
      const next = current + dir;
      if (next < 0 || next >= gift.album.photos.length) return current;
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
        <Dialog.Root>
          <Dialog.Trigger className="text-button">{gift.secret.button}</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="dialog-overlay" />
            <Dialog.Content className="dialog-card">
              <p className="section-label">Giấu trong hộp</p>
              <Dialog.Title className="block-title">{gift.secret.title}</Dialog.Title>
              <Dialog.Description className="secret-copy">{gift.secret.message}</Dialog.Description>
              <Dialog.Close className="text-button text-button-quiet">{gift.secret.close}</Dialog.Close>
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
