const PETALS = [0, 1, 2, 3, 4, 5, 6, 7] as const;

export function Atmosphere() {
  return (
    <div className="atmosphere" aria-hidden="true">
      <span className="dust" />
      {PETALS.map((petal) => (
        <span key={petal} className={`petal petal-${petal}`} />
      ))}
    </div>
  );
}
