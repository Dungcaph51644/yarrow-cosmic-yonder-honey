const STARS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] as const;
const SHOOTING_STARS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

export function Atmosphere() {
  return (
    <div className="atmosphere" aria-hidden="true">
      <span className="starfield" />
      {STARS.map((star) => (
        <span key={star} className={`star star-${star}`} />
      ))}
      {SHOOTING_STARS.map((star) => (
        <span key={star} className={`shooting-star shooting-star-${star}`} />
      ))}
    </div>
  );
}
