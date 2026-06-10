export function Footer() {
  return (
    <footer className="mt-12 border-t-[3px] border-oranje bg-navy">
      <div className="flag-strip" />
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-6 text-center">
        <div className="pixel-heading text-[0.6rem] text-oranje">
          DutchMSP WK 2026 Poule
        </div>
        <p className="text-sm text-muted-foreground">
          Hup Holland Hup — sinds EK &apos;88 niet meer zo mooi in het oranje
        </p>
        <p className="pixel-heading text-[0.5rem] text-muted-foreground/60">
          © 2026 · Press start to play
        </p>
      </div>
    </footer>
  );
}
