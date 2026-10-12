type WindowWithWebkit = Window & {
  webkitAudioContext?: typeof AudioContext;
};

/** A short music-box figure. Only call from a user gesture. */
export function playChime() {
  const Ctx = window.AudioContext ?? (window as WindowWithWebkit).webkitAudioContext;
  if (!Ctx) return;

  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(ctx.destination);

  const notes = [523.25, 659.25, 783.99, 1046.5, 783.99];
  const start = ctx.currentTime + 0.02;

  notes.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const t = start + index * 0.16;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.05, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.35);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t);
    osc.stop(t + 1.4);
  });

  window.setTimeout(() => {
    void ctx.close();
  }, 2800);
}
