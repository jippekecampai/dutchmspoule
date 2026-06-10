import { useEffect, useRef } from "react";

/*
 * 8-bit "attract mode" die de drie Nederlandse groepswedstrijden als
 * game-levels afspeelt: intro-scherm, gameplay met doelpunt, eindstand.
 * Getekend op 320x180 en opgeschaald met image-rendering: pixelated.
 */

const W = 320;
const H = 180;

const INTRO = 2.6;
const PLAY = 4.6;
const OUTRO = 2.2;
const MATCH_DUR = INTRO + PLAY + OUTRO;

const ORANJE = "#ff7b24";
const ORANJE_DARK = "#d8590a";
const SKIN = "#fcd0a0";
const NIGHT = "#0d1326";

type Team = { code: string; name: string; shirt: string; shorts: string };

const NED: Team = { code: "NED", name: "NEDERLAND", shirt: ORANJE, shorts: "#ffffff" };

const MATCHES: {
  level: number;
  home: Team;
  away: Team;
  final: [number, number];
  venue: string;
}[] = [
  {
    level: 1,
    home: NED,
    away: { code: "JPN", name: "JAPAN", shirt: "#2746d8", shorts: "#ffffff" },
    final: [2, 0],
    venue: "DALLAS",
  },
  {
    level: 2,
    home: NED,
    away: { code: "ZWE", name: "ZWEDEN", shirt: "#ffd23c", shorts: "#2746d8" },
    final: [3, 1],
    venue: "HOUSTON",
  },
  {
    level: 3,
    home: { code: "TUN", name: "TUNESIE", shirt: "#e23030", shorts: "#ffffff" },
    away: NED,
    final: [0, 2],
    venue: "KANSAS CITY",
  },
];

// Voorspelde uitslag van de ingelogde speler, per level (volgorde = sort_order).
export type PredictedScore = { home: number; away: number } | null;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}

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

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  team: Team,
  frame: number,
  flip = false
) {
  const d = flip ? -1 : 1;
  px(ctx, x - 2, y - 14, 4, 2, "#3b2716");
  px(ctx, x - 2, y - 12, 4, 3, SKIN);
  px(ctx, x - 3, y - 9, 6, 5, team.shirt);
  px(ctx, x - 3 + (frame ? d : -d), y - 8, 1, 3, SKIN);
  px(ctx, x + 2 + (frame ? -d : d), y - 8, 1, 3, SKIN);
  px(ctx, x - 3, y - 4, 6, 2, team.shorts);
  if (frame) {
    px(ctx, x - 3, y - 2, 2, 2, SKIN);
    px(ctx, x + 1, y - 1, 2, 1, SKIN);
  } else {
    px(ctx, x - 3, y - 1, 2, 1, SKIN);
    px(ctx, x + 1, y - 2, 2, 2, SKIN);
  }
  px(ctx, x - 3, y, 2, 1, "#111111");
  px(ctx, x + 1, y, 2, 1, "#111111");
}

function drawKeeper(ctx: CanvasRenderingContext2D, x: number, y: number, dive: number) {
  const c = "#16a34a";
  if (dive <= 0) {
    px(ctx, x - 2, y - 14, 4, 2, "#3b2716");
    px(ctx, x - 2, y - 12, 4, 3, SKIN);
    px(ctx, x - 3, y - 9, 6, 5, c);
    px(ctx, x - 3, y - 4, 6, 2, "#111111");
    px(ctx, x - 3, y - 2, 2, 2, SKIN);
    px(ctx, x + 1, y - 2, 2, 2, SKIN);
  } else {
    const dy = lerp(0, 8, dive);
    px(ctx, x - 7, y - 8 + dy, 10, 4, c);
    px(ctx, x + 3, y - 9 + dy, 3, 3, SKIN);
    px(ctx, x - 11, y - 7 + dy, 4, 2, "#111111");
  }
}

function drawZigzagBand(ctx: CanvasRenderingContext2D, y: number, h: number) {
  px(ctx, 0, y, W, h, ORANJE_DARK);
  ctx.fillStyle = ORANJE;
  for (let x = -8; x < W + 8; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + 8, y);
    ctx.lineTo(x + 16, y + h);
    ctx.closePath();
    ctx.fill();
  }
}

function drawStadium(ctx: CanvasRenderingContext2D, t: number) {
  px(ctx, 0, 0, W, 44, NIGHT);
  for (let y = 8; y < 40; y += 6) {
    for (let x = 2; x < W; x += 5) {
      const v = Math.sin(x * 12.9 + y * 78.2) * 43758.5;
      const r = v - Math.floor(v);
      const blink = Math.sin(t * 3 + x * 0.7 + y) > 0.97;
      ctx.fillStyle = blink
        ? "#ffffff"
        : r > 0.66
        ? "#e8b04a"
        : r > 0.33
        ? "#b35a2a"
        : "#3a4368";
      ctx.fillRect(x, y, 2, 2);
    }
  }
  px(ctx, 0, 42, W, 2, "#222a44");

  for (let i = 0; i < 4; i++) {
    const lx = 30 + i * 86;
    px(ctx, lx, 0, 2, 8, "#222a44");
    px(ctx, lx - 4, 0, 10, 3, "#fff7c0");
  }
}

function drawField(ctx: CanvasRenderingContext2D) {
  for (let i = 0; i < 7; i++) {
    px(ctx, 0, 44 + i * 20, W, 20, i % 2 ? "#2f9e44" : "#37b24d");
  }
  px(ctx, 0, 168, W, 12, "#2b8a3e");

  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 1;
  ctx.strokeRect(6.5, 50.5, W - 13, 116);
  ctx.beginPath();
  ctx.moveTo(W / 2 + 0.5, 51);
  ctx.lineTo(W / 2 + 0.5, 166);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(W / 2 + 0.5, 108, 18, 12, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeRect(W - 40.5, 78.5, 34, 60);

  px(ctx, W - 14, 70, 3, 50, "#ffffff");
  px(ctx, W - 30, 70, 19, 3, "#ffffff");
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  for (let i = 1; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(W - 28 + i * 3, 73);
    ctx.lineTo(W - 14, 73 + i * 9);
    ctx.stroke();
  }
}

function drawScoreboard(
  ctx: CanvasRenderingContext2D,
  m: (typeof MATCHES)[number],
  score: [number, number],
  clock: string
) {
  px(ctx, W / 2 - 64, 2, 128, 18, "rgba(6,9,20,0.92)");
  px(ctx, W / 2 - 64, 2, 128, 2, ORANJE);
  text(ctx, `${m.home.code} ${score[0]}-${score[1]} ${m.away.code}`, W / 2, 7, 7, "#ffffff");
  text(ctx, clock, W / 2, 14, 5, "#9aa4c8");
}

function drawIntro(ctx: CanvasRenderingContext2D, m: (typeof MATCHES)[number], t: number) {
  px(ctx, 0, 0, W, H, NIGHT);
  drawZigzagBand(ctx, 0, 14);
  drawZigzagBand(ctx, H - 14, 14);

  text(ctx, `LEVEL ${m.level}`, W / 2, 30, 10, ORANJE);
  text(ctx, "GROEPSFASE", W / 2, 46, 6, "#9aa4c8");

  const slide = Math.min(1, t / 0.7);
  text(ctx, m.home.name, lerp(-80, W / 2, slide), 72, 9, m.home.code === "NED" ? ORANJE : "#ffffff");
  text(ctx, "VS", W / 2, 90, 8, "#ffd23c");
  text(ctx, m.away.name, lerp(W + 80, W / 2, slide), 108, 9, m.away.code === "NED" ? ORANJE : "#ffffff");

  text(ctx, m.venue, W / 2, 130, 6, "#9aa4c8");
  if (Math.floor(t * 2.2) % 2 === 0) {
    text(ctx, "READY?", W / 2, 150, 8, "#ffffff");
  }
}

function drawPlay(
  ctx: CanvasRenderingContext2D,
  m: (typeof MATCHES)[number],
  t: number,
  abs: number,
  goalScored: boolean
) {
  const oranjeTeam = NED;
  const otherTeam = m.home.code === "NED" ? m.away : m.home;

  drawStadium(ctx, abs);
  drawField(ctx);

  const T_PASS = 1.3;
  const T_RECEIVE = 2.1;
  const T_SHOT = 3.1;
  const T_GOAL = 3.5;

  let bx: number;
  let by: number;
  if (t < T_PASS) {
    bx = lerp(36, 118, t / T_PASS);
    by = 142 + Math.sin(t * 18) * 1.5;
  } else if (t < T_RECEIVE) {
    const k = (t - T_PASS) / (T_RECEIVE - T_PASS);
    bx = lerp(118, 198, k);
    by = lerp(142, 128, k) - Math.sin(k * Math.PI) * 14;
  } else if (t < T_SHOT) {
    const k = (t - T_SHOT + (T_SHOT - T_RECEIVE)) / (T_SHOT - T_RECEIVE);
    bx = lerp(198, 236, k);
    by = lerp(128, 122, k) + Math.sin(t * 18) * 1.5;
  } else if (t < T_GOAL) {
    const k = (t - T_SHOT) / (T_GOAL - T_SHOT);
    bx = lerp(236, W - 18, k);
    by = lerp(122, 100, k) - Math.sin(k * Math.PI) * 8;
  } else if (goalScored) {
    bx = W - 18;
    by = 102 + Math.min(6, (t - T_GOAL) * 20);
  } else {
    // Keeper pakt 'm: de bal stuit terug het veld in.
    const k = Math.min(1, (t - T_GOAL) * 1.2);
    bx = lerp(W - 24, W - 90, k);
    by = lerp(104, 134, k) - Math.sin(k * Math.PI) * 16;
  }

  const frame = Math.floor(t * 9) % 2;
  const a1x = t < T_PASS ? bx - 6 : lerp(112, 150, (t - T_PASS) / 2);
  drawPlayer(ctx, a1x, 146, oranjeTeam, frame);
  const a2x = t < T_RECEIVE ? lerp(170, 196, t / T_RECEIVE) : Math.min(bx - 6, 230);
  drawPlayer(ctx, a2x, 132, oranjeTeam, frame);
  drawPlayer(ctx, lerp(60, 120, t / PLAY), 112, oranjeTeam, 1 - frame);

  const d1x = Math.max(bx + 16, 150);
  drawPlayer(ctx, Math.min(d1x, 250), 138, otherTeam, frame, true);
  drawPlayer(ctx, Math.min(Math.max(bx + 30, 190), 262), 118, otherTeam, 1 - frame, true);

  const dive = t > T_SHOT ? Math.min(1, (t - T_SHOT) * 3) : 0;
  drawKeeper(ctx, W - 22, 110, dive);

  px(ctx, bx - 1, by - 2, 3, 3, "#ffffff");
  px(ctx, bx, by - 1, 1, 1, "#999999");

  const resolved = t >= T_GOAL;
  const scored = resolved && goalScored;
  const liveScore: [number, number] =
    m.home.code === "NED" ? [scored ? 1 : 0, 0] : [0, scored ? 1 : 0];
  const minutes = Math.min(90, Math.floor((t / PLAY) * 90));
  drawScoreboard(ctx, m, liveScore, `${String(minutes).padStart(2, "0")}:00`);

  if (scored) {
    const blink = Math.floor(abs * 7) % 2 === 0;
    if (t < T_GOAL + 0.15) px(ctx, 0, 0, W, H, "rgba(255,255,255,0.55)");
    text(ctx, "GOAL!!!", W / 2 + 2, 78, 18, "#06091a");
    text(ctx, "GOAL!!!", W / 2, 76, 18, blink ? "#ffd23c" : "#ffffff");
  } else if (resolved) {
    const blink = Math.floor(abs * 7) % 2 === 0;
    text(ctx, "GEPAKT!", W / 2 + 2, 78, 16, "#06091a");
    text(ctx, "GEPAKT!", W / 2, 76, 16, blink ? "#ffffff" : "#9aa4c8");
  }
}

function drawOutro(
  ctx: CanvasRenderingContext2D,
  m: (typeof MATCHES)[number],
  t: number,
  final: [number, number],
  isPrediction: boolean
) {
  px(ctx, 0, 0, W, H, NIGHT);
  drawZigzagBand(ctx, 0, 10);
  drawZigzagBand(ctx, H - 10, 10);

  text(ctx, isPrediction ? "JOUW VOORSPELLING" : "EINDSTAND", W / 2, 32, 8, isPrediction ? ORANJE : "#9aa4c8");
  text(ctx, m.home.code, W / 2 - 70, 64, 10, m.home.code === "NED" ? ORANJE : "#ffffff");
  text(ctx, `${final[0]} - ${final[1]}`, W / 2, 62, 14, "#ffd23c");
  text(ctx, m.away.code, W / 2 + 70, 64, 10, m.away.code === "NED" ? ORANJE : "#ffffff");

  const nedGoals = m.home.code === "NED" ? final[0] : final[1];
  const oppGoals = m.home.code === "NED" ? final[1] : final[0];
  const verdict =
    nedGoals > oppGoals
      ? m.level < 3
        ? `LEVEL ${m.level} CLEAR!`
        : "GROEP F VOLTOOID!"
      : nedGoals === oppGoals
      ? "GELIJKSPEL..."
      : "GAME OVER";

  if (Math.floor(t * 2.5) % 2 === 0) {
    text(ctx, verdict, W / 2, 104, 8, nedGoals < oppGoals ? "#e23030" : "#ffffff");
  }
  if (nedGoals > oppGoals) {
    text(ctx, "*".repeat(m.level), W / 2, 126, 12, "#ffd23c");
  }
  if (m.level === 3) {
    text(ctx, "HUP HOLLAND HUP", W / 2, 150, 6, ORANJE);
  }
}

function drawFrame(ctx: CanvasRenderingContext2D, abs: number, predictions?: PredictedScore[]) {
  const cycle = abs % (MATCH_DUR * MATCHES.length);
  const idx = Math.min(MATCHES.length - 1, Math.floor(cycle / MATCH_DUR));
  const m = MATCHES[idx];
  const t = cycle - idx * MATCH_DUR;

  const pred = predictions?.[idx] ?? null;
  const final: [number, number] = pred ? [pred.home, pred.away] : m.final;
  const nedGoals = m.home.code === "NED" ? final[0] : final[1];

  if (t < INTRO) drawIntro(ctx, m, t);
  else if (t < INTRO + PLAY) drawPlay(ctx, m, t - INTRO, abs, nedGoals > 0);
  else drawOutro(ctx, m, t - INTRO - PLAY, final, !!pred);
}

export function RetroGameIntro({
  className,
  predictions,
}: {
  className?: string;
  predictions?: PredictedScore[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      drawFrame(ctx, INTRO + 2.2, predictions);
      return;
    }

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      drawFrame(ctx, (now - start) / 1000, predictions);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [predictions]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      className={className}
      style={{ imageRendering: "pixelated" }}
      aria-hidden="true"
    />
  );
}
