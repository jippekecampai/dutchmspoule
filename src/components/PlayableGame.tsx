import { useEffect, useRef, useState } from "react";

/*
 * Speelbaar 8-bit mini-voetbalspelletje: 2 helften van 1 minuut met 5 seconden rust.
 * Besturing: pijltjes / WASD om te bewegen, spatie om te schieten.
 * Mobiel: virtuele D-pad + schiet-knop onder het canvas.
 */

const W = 320;
const H = 180;
const HALF_SECONDS = 60;
const BREAK_SECONDS = 5;

const ORANJE = "#ff7b24";
const ROOD = "#e23030";
const SKIN = "#fcd0a0";

type Phase = "idle" | "half1" | "break" | "half2" | "done";

type Vec = { x: number; y: number };

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function text(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  size: number,
  c: string,
  align: CanvasTextAlign = "center"
) {
  ctx.font = `${size}px "Press Start 2P", monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  ctx.fillStyle = c;
  ctx.fillText(s, Math.round(x), Math.round(y));
}

function drawField(ctx: CanvasRenderingContext2D) {
  for (let i = 0; i < 9; i++) {
    px(ctx, 0, i * 20, W, 20, i % 2 ? "#2f9e44" : "#37b24d");
  }
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 1;
  ctx.strokeRect(6.5, 22.5, W - 13, H - 30);
  ctx.beginPath();
  ctx.moveTo(W / 2 + 0.5, 23);
  ctx.lineTo(W / 2 + 0.5, H - 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(W / 2 + 0.5, H / 2 + 6, 18, 12, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Doelen
  px(ctx, 2, H / 2 - 14, 3, 36, "#ffffff");
  px(ctx, W - 5, H / 2 - 14, 3, 36, "#ffffff");
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  p: Vec,
  shirt: string,
  shorts: string,
  frame: number
) {
  const x = Math.round(p.x);
  const y = Math.round(p.y);
  px(ctx, x - 2, y - 14, 4, 2, "#3b2716");
  px(ctx, x - 2, y - 12, 4, 3, SKIN);
  px(ctx, x - 3, y - 9, 6, 5, shirt);
  px(ctx, x - 3, y - 4, 6, 2, shorts);
  if (frame) {
    px(ctx, x - 3, y - 2, 2, 2, SKIN);
    px(ctx, x + 1, y - 1, 2, 1, SKIN);
  } else {
    px(ctx, x - 3, y - 1, 2, 1, SKIN);
    px(ctx, x + 1, y - 2, 2, 2, SKIN);
  }
}

function clamp(v: number, a: number, b: number) {
  return Math.min(b, Math.max(a, v));
}

export function PlayableGame({
  onExit,
  opponentName = "Tegenstander",
  opponentCode = "CPU",
}: {
  onExit: () => void;
  opponentName?: string;
  opponentCode?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState<[number, number]>([0, 0]);
  const [clock, setClock] = useState(HALF_SECONDS);

  // Mutable state via refs (game loop)
  const stateRef = useRef({
    player: { x: 80, y: H / 2 } as Vec,
    opponent: { x: 240, y: H / 2 } as Vec,
    ball: { x: W / 2, y: H / 2 } as Vec,
    ballV: { x: 0, y: 0 } as Vec,
    keys: new Set<string>(),
    touch: { up: false, down: false, left: false, right: false, shoot: false },
    shootCool: 0,
    flashGoal: 0,
    frame: 0,
    home: 0,
    away: 0,
    phaseTimer: HALF_SECONDS,
    phase: "idle" as Phase,
  });

  useEffect(() => {
    stateRef.current.phase = phase;
  }, [phase]);

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      stateRef.current.keys.add(k);
      if (k === " " || k === "arrowup" || k === "arrowdown" || k === "arrowleft" || k === "arrowright") {
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => stateRef.current.keys.delete(e.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    let raf = 0;
    let last = performance.now();
    let secAcc = 0;

    const resetKickoff = (towardRight: boolean) => {
      const s = stateRef.current;
      s.ball = { x: W / 2, y: H / 2 };
      s.ballV = { x: 0, y: 0 };
      s.player = { x: towardRight ? W / 2 - 24 : W / 2 + 24, y: H / 2 };
      s.opponent = { x: towardRight ? W / 2 + 24 : W / 2 - 24, y: H / 2 };
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = stateRef.current;

      // Klok
      if (s.phase === "half1" || s.phase === "half2" || s.phase === "break") {
        secAcc += dt;
        while (secAcc >= 1) {
          secAcc -= 1;
          s.phaseTimer -= 1;
          if (s.phaseTimer <= 0) {
            if (s.phase === "half1") {
              s.phase = "break";
              s.phaseTimer = BREAK_SECONDS;
              setPhase("break");
              resetKickoff(false);
            } else if (s.phase === "break") {
              s.phase = "half2";
              s.phaseTimer = HALF_SECONDS;
              setPhase("half2");
              resetKickoff(false);
            } else if (s.phase === "half2") {
              s.phase = "done";
              setPhase("done");
            }
          }
          setClock(s.phaseTimer);
        }
      }

      const playing = s.phase === "half1" || s.phase === "half2";
      s.frame = (s.frame + dt * 8) % 2;

      if (playing) {
        // Input
        const speed = 70;
        let dx = 0;
        let dy = 0;
        const k = s.keys;
        const t = s.touch;
        if (k.has("arrowup") || k.has("w") || t.up) dy -= 1;
        if (k.has("arrowdown") || k.has("s") || t.down) dy += 1;
        if (k.has("arrowleft") || k.has("a") || t.left) dx -= 1;
        if (k.has("arrowright") || k.has("d") || t.right) dx += 1;
        const len = Math.hypot(dx, dy) || 1;
        s.player.x = clamp(s.player.x + (dx / len) * speed * dt, 8, W - 8);
        s.player.y = clamp(s.player.y + (dy / len) * speed * dt, 28, H - 14);

        // Bal naast speler -> meeslepen
        const dxb = s.ball.x - s.player.x;
        const dyb = s.ball.y - s.player.y - 2;
        const dist = Math.hypot(dxb, dyb);
        const hasBall = dist < 9 && Math.hypot(s.ballV.x, s.ballV.y) < 60;
        if (hasBall) {
          const ang = Math.atan2(dy, dx || 0.001);
          const moving = dx !== 0 || dy !== 0;
          if (moving) {
            s.ball.x = s.player.x + Math.cos(ang) * 7;
            s.ball.y = s.player.y - 2 + Math.sin(ang) * 7;
          } else {
            s.ball.x = s.player.x + 7;
            s.ball.y = s.player.y - 2;
          }
          s.ballV.x = 0;
          s.ballV.y = 0;

          // Schieten — richt op het doel waar NED naar toe speelt
          s.shootCool = Math.max(0, s.shootCool - dt);
          if ((k.has(" ") || k.has("enter") || t.shoot) && s.shootCool === 0) {
            const attackRight = s.phase === "half1";
            const tx = attackRight ? W - 6 : 6;
            const ty = H / 2 + (Math.random() - 0.5) * 28;
            const dxs = tx - s.ball.x;
            const dys = ty - s.ball.y;
            const dl = Math.hypot(dxs, dys) || 1;
            const power = 220;
            s.ballV.x = (dxs / dl) * power;
            s.ballV.y = (dys / dl) * power;
            s.shootCool = 0.5;
          }
        }

        // Tegenstander AI: loop naar de bal, tackle als dichtbij
        const odx = s.ball.x - s.opponent.x;
        const ody = s.ball.y - s.opponent.y - 2;
        const od = Math.hypot(odx, ody) || 1;
        const ospeed = 48;
        s.opponent.x = clamp(s.opponent.x + (odx / od) * ospeed * dt, 8, W - 8);
        s.opponent.y = clamp(s.opponent.y + (ody / od) * ospeed * dt, 28, H - 14);
        const attackRight = s.phase === "half1";
        if (od < 8 && hasBall) {
          // Tackle: bal wegschieten richting de helft van NED
          s.ballV.x = attackRight ? -140 : 140;
          s.ballV.y = (Math.random() - 0.5) * 80;
        }

        // Bal fysica
        s.ball.x += s.ballV.x * dt;
        s.ball.y += s.ballV.y * dt;
        const friction = 0.985;
        s.ballV.x *= friction;
        s.ballV.y *= friction;
        if (s.ball.y < 24) {
          s.ball.y = 24;
          s.ballV.y *= -0.6;
        }
        if (s.ball.y > H - 10) {
          s.ball.y = H - 10;
          s.ballV.y *= -0.6;
        }

        // Doelpunten — NED valt aan naar rechts in helft 1, naar links in helft 2
        const inGoalY = s.ball.y > H / 2 - 14 && s.ball.y < H / 2 + 22;
        const rightGoal = s.ball.x > W - 6 && inGoalY;
        const leftGoal = s.ball.x < 6 && inGoalY;
        if (rightGoal || leftGoal) {
          const nedScored = attackRight ? rightGoal : leftGoal;
          if (nedScored) s.home += 1;
          else s.away += 1;
          setScore([s.home, s.away]);
          s.flashGoal = 1.0;
          // Aftrap: NED start altijd op eigen helft
          resetKickoff(attackRight);
        } else if (s.ball.x < 4) {
          s.ball.x = 4;
          s.ballV.x *= -0.5;
        } else if (s.ball.x > W - 4) {
          s.ball.x = W - 4;
          s.ballV.x *= -0.5;
        }
      }

      // Render
      drawField(ctx);
      drawPlayer(ctx, s.player, ORANJE, "#ffffff", Math.floor(s.frame));
      drawPlayer(ctx, s.opponent, ROOD, "#ffffff", 1 - Math.floor(s.frame));
      px(ctx, s.ball.x - 1, s.ball.y - 1, 3, 3, "#ffffff");

      // Scorebord
      px(ctx, W / 2 - 56, 2, 112, 18, "rgba(6,9,20,0.92)");
      px(ctx, W / 2 - 56, 2, 112, 2, ORANJE);
      text(ctx, `NED ${s.home}-${s.away} ${opponentCode.slice(0, 3).toUpperCase()}`, W / 2, 7, 7, "#ffffff");
      const mm = Math.max(0, s.phaseTimer);
      text(ctx, `${String(mm).padStart(2, "0")}s`, W / 2, 14, 5, "#9aa4c8");

      if (s.phase === "idle") {
        px(ctx, 0, 60, W, 60, "rgba(6,9,20,0.85)");
        text(ctx, `NED vs ${opponentName.toUpperCase()}`, W / 2, 70, 8, ORANJE);
        text(ctx, "2x 1 MIN  -  PAUZE 5S", W / 2, 88, 6, "#ffffff");
        text(ctx, "PIJLTJES + SPATIE", W / 2, 102, 5, "#9aa4c8");
      } else if (s.phase === "break") {
        px(ctx, 0, 66, W, 48, "rgba(6,9,20,0.9)");
        text(ctx, "RUST  -  WISSEL VAN HELFT", W / 2, 74, 6, ORANJE);
        text(ctx, `2E HELFT IN ${s.phaseTimer}S`, W / 2, 92, 6, "#ffffff");
        text(ctx, "NU AANVALLEN NAAR LINKS", W / 2, 104, 5, "#9aa4c8");
      } else if (s.phase === "done") {
        px(ctx, 0, 60, W, 60, "rgba(6,9,20,0.9)");
        text(ctx, "EINDE", W / 2, 68, 10, ORANJE);
        text(ctx, `${s.home} - ${s.away}`, W / 2, 88, 14, "#ffd23c");
        text(
          ctx,
          s.home > s.away ? "GEWONNEN!" : s.home === s.away ? "GELIJKSPEL" : "VERLOREN",
          W / 2,
          108,
          6,
          "#ffffff"
        );
      }

      if (s.flashGoal > 0) {
        s.flashGoal -= dt;
        text(ctx, "GOAL!", W / 2, 130, 14, "#ffd23c");
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const start = () => {
    const s = stateRef.current;
    s.home = 0;
    s.away = 0;
    setScore([0, 0]);
    s.phaseTimer = HALF_SECONDS;
    setClock(HALF_SECONDS);
    s.phase = "half1";
    setPhase("half1");
    s.ball = { x: W / 2, y: H / 2 };
    s.ballV = { x: 0, y: 0 };
    s.player = { x: W / 2 - 24, y: H / 2 };
    s.opponent = { x: W / 2 + 24, y: H / 2 };
  };

  const setTouch = (key: keyof typeof stateRef.current.touch, v: boolean) => {
    stateRef.current.touch[key] = v;
  };

  const padBtn = (label: string, key: keyof typeof stateRef.current.touch) => (
    <button
      type="button"
      aria-label={label}
      className="pixel-btn flex h-12 w-12 select-none items-center justify-center bg-navy-light text-foreground active:bg-oranje active:text-primary-foreground"
      onPointerDown={(e) => {
        e.preventDefault();
        setTouch(key, true);
      }}
      onPointerUp={() => setTouch(key, false)}
      onPointerLeave={() => setTouch(key, false)}
      onPointerCancel={() => setTouch(key, false)}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-2xl">
      <div className="border-[6px] border-oranje bg-black p-1.5 shadow-[8px_8px_0_0_rgb(0_0_0/0.6)]">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="block aspect-video w-full"
          style={{ imageRendering: "pixelated" }}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {(phase === "idle" || phase === "done") && (
          <button
            type="button"
            onClick={start}
            className="pixel-btn bg-oranje px-4 py-2 text-primary-foreground hover:bg-oranje-dark"
          >
            {phase === "done" ? "OPNIEUW SPELEN" : "START WEDSTRIJD"}
          </button>
        )}
        <button
          type="button"
          onClick={onExit}
          className="pixel-btn bg-navy-light px-4 py-2 text-foreground hover:bg-secondary"
        >
          STOP
        </button>
      </div>

      {/* Mobiele besturing */}
      <div className="mt-4 flex items-center justify-between gap-4 sm:hidden">
        <div className="grid grid-cols-3 grid-rows-3 gap-1">
          <div />
          {padBtn("▲", "up")}
          <div />
          {padBtn("◀", "left")}
          <div />
          {padBtn("▶", "right")}
          <div />
          {padBtn("▼", "down")}
          <div />
        </div>
        <button
          type="button"
          aria-label="Schieten"
          className="pixel-btn flex h-16 w-16 items-center justify-center bg-oranje text-primary-foreground active:bg-oranje-dark"
          onPointerDown={(e) => {
            e.preventDefault();
            setTouch("shoot", true);
          }}
          onPointerUp={() => setTouch("shoot", false)}
          onPointerLeave={() => setTouch("shoot", false)}
          onPointerCancel={() => setTouch("shoot", false)}
        >
          SHOOT
        </button>
      </div>

      <p className="pixel-heading mt-4 text-center text-[0.55rem] text-muted-foreground">
        Score: {score[0]} - {score[1]} • Tijd: {clock}s • {phase.toUpperCase()}
      </p>
    </div>
  );
}
