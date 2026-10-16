const HEARTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
const FLOWERS = [0, 1, 2, 3, 4, 5, 6, 7] as const;
const FLOWER_PETALS = [0, 1, 2, 3, 4] as const;

export function GiftBox({ opening }: { opening: boolean }) {
  return (
    <div className={opening ? "present is-opening" : "present"}>
      <span className="present-shadow" />
      <span className="present-glow" />
      <div className="scene3d">
        <div className="cube">
          <div className="face front">
            <span className="band band-v" />
          </div>
          <div className="face right">
            <span className="band band-v" />
          </div>
          <div className="face left" />
          <div className="face back">
            <span className="band band-v" />
          </div>
          <div className="face inside" />
          <div className="lid">
            <span className="band band-v" />
            <span className="band band-h" />
            <span className="bow">
              <i className="loop loop-l" />
              <i className="loop loop-r" />
              <i className="knot" />
              <i className="tail tail-l" />
              <i className="tail tail-r" />
            </span>
          </div>
        </div>
      </div>
      <div className="hearts">
        {HEARTS.map((heart) => (
          <span key={heart} className={`float-heart heart-${heart}`} />
        ))}
      </div>
      <div className="flower-burst" aria-hidden="true">
        {FLOWERS.map((flower) => (
          <span key={flower} className={`bloom-flower bloom-${flower}`}>
            {FLOWER_PETALS.map((petal) => (
              <i key={petal} className="bloom-petal" />
            ))}
            <i className="bloom-center" />
          </span>
        ))}
      </div>
    </div>
  );
}
