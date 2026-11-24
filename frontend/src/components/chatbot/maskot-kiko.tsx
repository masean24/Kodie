"use client";

import { useEffect, useId, useRef } from "react";
import { cx } from "@/lib/cx";

export type EkspresiKiko = "smile" | "thinking" | "happy" | "wink" | "curious" | "surprised" | "sleep";
export type JenisBlipKiko = "pop" | "jump" | "wake" | "reply";

const C = { blue: "#1D4ED8", lime: "#C6F64D", navy: "#0F172A" };
const IDLE_SLEEP_MS = 14_000;
const CYCLE_INTERVAL_MS = 4_600;

export const KIKO_IDLE_SEQUENCE: { expr: EkspresiKiko; tip: string }[] = [
  { expr: "smile", tip: "Hai! Ada yang bisa kubantu? :)" },
  { expr: "curious", tip: "Lagi cari info program & kelas di Kodie? 🧐" },
  { expr: "wink", tip: "Tips: coba Tes Minat IT gratis kalau masih bingung! ;)" },
  { expr: "happy", tip: "Senang bisa menemanimu belajar di Kodie! 🎉" },
  { expr: "smile", tip: "Klik Kiko kalau butuh bantuan! :)" },
];

let sharedAudioCtx: AudioContext | null = null;

/** Efek suara blip robotik halus berbasis Web Audio API (tanpa file audio eksternal). */
export function putarBlipKiko(type: JenisBlipKiko, enabled: boolean) {
  if (!enabled || typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!sharedAudioCtx) sharedAudioCtx = new AudioContextClass();
    if (sharedAudioCtx.state === "suspended") void sharedAudioCtx.resume();

    const now = sharedAudioCtx.currentTime;
    const osc = sharedAudioCtx.createOscillator();
    const gain = sharedAudioCtx.createGain();
    osc.connect(gain);
    gain.connect(sharedAudioCtx.destination);

    if (type === "jump") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.12);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
      osc.start(now);
      osc.stop(now + 0.14);
    } else if (type === "wake") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.setValueAtTime(640, now + 0.07);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.start(now);
      osc.stop(now + 0.17);
    } else if (type === "reply") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.19);
    } else {
      osc.type = "sine";
      osc.frequency.setValueAtTime(480, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.07);
    }
  } catch {
    // Abaikan jika browser memblokir audio sebelum interaksi pertama
  }
}

function poseUntukEkspresi(expr: EkspresiKiko, t: number): [{ sh: number; el: number }, { sh: number; el: number }] {
  const hang = (s: number) => ({ sh: 30 + Math.sin(t * 2.2 + s) * 2.5, el: 6 });
  if (expr === "sleep") {
    const slow = Math.sin(t * 1.4) * 1.5;
    return [{ sh: 36 + slow, el: 10 }, { sh: 36 - slow, el: 10 }];
  }
  if (expr === "surprised") {
    return [
      { sh: -26, el: -64 + Math.sin(t * 10) * 3 },
      { sh: -26, el: -64 - Math.sin(t * 10) * 3 },
    ];
  }
  if (expr === "smile") {
    return [{ sh: -20, el: -42 + Math.sin(t * 6) * 14 }, hang(0)];
  }
  if (expr === "thinking") {
    const pulse = Math.sin(t * 6) * 4;
    return [{ sh: 16, el: -36 + pulse }, { sh: 16, el: -36 - pulse }];
  }
  if (expr === "happy") {
    const b = Math.sin(t * 8) * 6;
    return [{ sh: -32, el: -56 + b }, { sh: -32, el: -56 - b }];
  }
  if (expr === "wink") {
    return [{ sh: -12, el: -35 + Math.sin(t * 4) * 5 }, { sh: 28, el: -20 }];
  }
  if (expr === "curious") {
    return [{ sh: 26, el: -24 }, { sh: -38, el: -72 + Math.sin(t * 2) * 3 }];
  }
  const br = Math.sin(t * 2.5) * 2;
  return [{ sh: 28 + br, el: -25 }, { sh: 28 - br, el: -25 }];
}

function bangunMarkupWajah({
  expr,
  t,
  ox,
  oy,
  isSpeaking,
}: {
  expr: EkspresiKiko;
  t: number;
  ox: number;
  oy: number;
  isSpeaking: boolean;
}): string {
  const hudBrackets = `<g opacity="0.22" stroke-width="3.5"><path d="M98 76 H90 V84"/><path d="M242 76 H250 V84"/><path d="M98 190 H90 V182"/><path d="M242 190 H250 V182"/></g>`;

  if (expr === "thinking") {
    const activeIdx = Math.floor(t * 12) % 12;
    let spokes = "";
    for (let i = 0; i < 12; i++) {
      const angle = i * 30;
      const lag = (activeIdx - i + 12) % 12;
      const op = (1 - (lag / 11) * 0.88).toFixed(2);
      spokes += `<rect x="-3.75" y="-39" width="7.5" height="19" rx="3.75" fill="${C.lime}" stroke="none" opacity="${op}" transform="rotate(${angle})"/>`;
    }
    return `${hudBrackets}<g transform="translate(170 133)">${spokes}</g>`;
  }

  if (expr === "sleep") {
    const zPhase1 = (t * 0.55) % 1;
    const zPhase2 = (t * 0.55 + 0.5) % 1;
    const z1Y = (114 - zPhase1 * 34).toFixed(1);
    const z1Op = Math.sin(zPhase1 * Math.PI).toFixed(2);
    const z2Y = (108 - zPhase2 * 36).toFixed(1);
    const z2Op = Math.sin(zPhase2 * Math.PI).toFixed(2);
    const breathR = (5 + Math.sin(t * 2.2) * 1.4).toFixed(1);
    const floatY = (Math.sin(t * 1.8) * 1.8).toFixed(1);
    return `${hudBrackets}<g transform="translate(0 ${floatY})"><path d="M124 130 Q140 142 156 130"/><path d="M184 130 Q200 142 216 130"/><circle cx="170" cy="158" r="${breathR}" stroke-width="5"/><text x="206" y="${z1Y}" fill="${C.lime}" stroke="none" opacity="${z1Op}" font-family="Inter, sans-serif" font-weight="800" font-size="16">z</text><text x="221" y="${z2Y}" fill="${C.lime}" stroke="none" opacity="${z2Op}" font-family="Inter, sans-serif" font-weight="800" font-size="21">Z</text></g>`;
  }

  const blink = t % 3.8 < 0.13;
  let eyes = "";
  let mouth = "";

  if (expr === "surprised") {
    eyes = `<circle cx="140" cy="124" r="10.5" fill="${C.lime}" stroke="none"/><circle cx="137" cy="121" r="3" fill="${C.navy}" stroke="none"/><circle cx="200" cy="124" r="10.5" fill="${C.lime}" stroke="none"/><circle cx="197" cy="121" r="3" fill="${C.navy}" stroke="none"/><path d="M128 106 Q140 100 152 106" stroke-width="4.5"/><path d="M188 106 Q200 100 212 106" stroke-width="4.5"/>`;
    mouth = `<circle cx="170" cy="160" r="8.5" stroke-width="6"/>`;
  } else if (expr === "happy") {
    eyes = `<path d="M124 132 Q140 112 156 132"/><path d="M184 132 Q200 112 216 132"/>`;
    mouth = `<path d="M142 148 Q170 186 198 148 Z" fill="${C.lime}"/>`;
  } else if (expr === "wink") {
    eyes = `<circle cx="142" cy="126" r="8.5" fill="${C.lime}" stroke="none"/><path d="M185 128 Q200 115 215 128"/>`;
    mouth = `<path d="M146 152 Q170 174 194 152"/>`;
  } else if (expr === "curious") {
    eyes = `<circle cx="142" cy="128" r="8.5" fill="${C.lime}" stroke="none"/><circle cx="198" cy="124" r="9.5" fill="${C.lime}" stroke="none"/><path d="M186 106 Q198 101 210 107" stroke-width="4.5"/>`;
    mouth = `<path d="M154 156 Q168 150 184 158"/>`;
  } else {
    eyes = blink
      ? `<path d="M130 126 H154"/><path d="M186 126 H210"/>`
      : `<circle cx="142" cy="126" r="8.5" fill="${C.lime}" stroke="none"/><circle cx="198" cy="126" r="8.5" fill="${C.lime}" stroke="none"/>`;
    mouth = `<path d="M144 152 Q170 176 196 152"/>`;
  }

  if (isSpeaking) {
    const openH = (4 + Math.abs(Math.sin(t * 17)) * 9).toFixed(1);
    mouth = `<ellipse cx="170" cy="158" rx="14" ry="${openH}" fill="${C.lime}" stroke="none"/>`;
  }

  return `${hudBrackets}<g transform="translate(${ox.toFixed(1)} ${oy.toFixed(1)})">${eyes}${mouth}</g>`;
}

/**
 * Komponen lengan statis tanpa prop `transform` di JSX agar mutasi `requestAnimationFrame`
 * di DOM tidak pernah tertimpa saat React melakukan re-render.
 */
function LenganSvg({
  armRef,
  foreRef,
}: {
  armRef: React.RefObject<SVGGElement | null>;
  foreRef: React.RefObject<SVGGElement | null>;
}) {
  return (
    <g ref={armRef}>
      <line x1="0" y1="0" x2="44" y2="0" stroke={C.navy} strokeWidth="13" strokeLinecap="round" />
      <circle r="13" fill={C.blue} />
      <g ref={foreRef}>
        <circle r="7" fill={C.navy} />
        <line x1="0" y1="0" x2="40" y2="0" stroke={C.navy} strokeWidth="12" strokeLinecap="round" />
        <rect x="30" y="-9.5" width="10" height="19" rx="4" fill={C.lime} />
        <g transform="translate(52 0)" stroke={C.navy} strokeWidth="2.6" strokeLinejoin="round" fill="#fff">
          <ellipse cx="-1" cy="-13" rx="5.2" ry="7.5" transform="rotate(-25 -1 -13)" />
          <circle cx="12" cy="-7" r="5.6" />
          <circle cx="14" cy="1" r="5.6" />
          <circle cx="12" cy="9" r="5.2" />
          <circle cx="0" cy="0" r="13.5" />
        </g>
      </g>
    </g>
  );
}

/**
 * Maskot 2D Interaktif Kiko: delta-time normalized (halus di 60Hz/120Hz/144Hz),
 * interpolasi kepala/mata/lengan tanpa patah saat state berubah, mode tidur idle (zZz),
 * lip-sync bicara, loading spinner 12 ruji, dan suara blip Web Audio API.
 */
export function MaskotKiko({
  ekspresi,
  isTypingChat,
  isSpeaking,
  isPanelOpen,
  isThinkingLock,
  soundEnabled,
  jumpSignal,
  onEkspresiOtomatis,
  onTipBerubah,
  className,
}: {
  ekspresi: EkspresiKiko;
  isTypingChat: boolean;
  isSpeaking: boolean;
  isPanelOpen: boolean;
  isThinkingLock: boolean;
  soundEnabled: boolean;
  jumpSignal: number;
  onEkspresiOtomatis: (exp: EkspresiKiko) => void;
  onTipBerubah: (tip: string) => void;
  className?: string;
}) {
  const clipId = `kiko-screen-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const rootRef = useRef<SVGGElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const faceRef = useRef<SVGGElement>(null);
  const antennaRef = useRef<SVGCircleElement>(null);
  const ledRef = useRef<SVGCircleElement>(null);
  const armLRef = useRef<SVGGElement>(null);
  const foreLRef = useRef<SVGGElement>(null);
  const armRRef = useRef<SVGGElement>(null);
  const foreRRef = useRef<SVGGElement>(null);

  const stateRef = useRef({
    ekspresi,
    isTypingChat,
    isSpeaking,
    isPanelOpen,
    isThinkingLock,
    soundEnabled,
  });

  const animRef = useRef({
    mouseX: 0,
    mouseY: 0,
    jumpY: 0,
    jumpV: 0,
    headX: 0,
    headRot: 0,
    eyeX: 0,
    eyeY: 0,
    lastActivity: 0,
    lastCycle: 0,
    cycleIdx: 0,
    armsState: [
      { sh: 30, el: 6 },
      { sh: 30, el: 6 },
    ],
  });

  const callbacksRef = useRef({ onEkspresiOtomatis, onTipBerubah });

  useEffect(() => {
    stateRef.current = {
      ekspresi,
      isTypingChat,
      isSpeaking,
      isPanelOpen,
      isThinkingLock,
      soundEnabled,
    };
  }, [ekspresi, isTypingChat, isSpeaking, isPanelOpen, isThinkingLock, soundEnabled]);

  useEffect(() => {
    callbacksRef.current = { onEkspresiOtomatis, onTipBerubah };
  }, [onEkspresiOtomatis, onTipBerubah]);

  useEffect(() => {
    if (jumpSignal === 0) return;
    if (animRef.current.jumpY === 0) {
      animRef.current.jumpV = 12;
      putarBlipKiko("jump", stateRef.current.soundEnabled);
    }
    animRef.current.lastActivity = performance.now();
  }, [jumpSignal]);

  useEffect(() => {
    if (isTypingChat || isSpeaking || isThinkingLock) {
      animRef.current.lastActivity = performance.now();
    }
  }, [isTypingChat, isSpeaking, isThinkingLock]);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const registerActivity = () => {
      const a = animRef.current;
      a.lastActivity = performance.now();
      if (stateRef.current.ekspresi === "sleep" && !stateRef.current.isThinkingLock) {
        putarBlipKiko("wake", stateRef.current.soundEnabled);
        callbacksRef.current.onEkspresiOtomatis("surprised");
        callbacksRef.current.onTipBerubah("Eh, kamu kembali! Ada yang bisa kubantu? :)");
        if (a.jumpY === 0 && !reduced) a.jumpV = 12;
        setTimeout(() => {
          if (stateRef.current.ekspresi === "surprised" && !stateRef.current.isThinkingLock) {
            callbacksRef.current.onEkspresiOtomatis("smile");
          }
        }, 1100);
      }
    };

    const onMove = (e: MouseEvent) => {
      animRef.current.mouseX = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      animRef.current.mouseY = -(e.clientY / Math.max(1, window.innerHeight)) * 2 + 1;
      registerActivity();
    };
    const onTouchOrClick = () => registerActivity();

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onTouchOrClick, { passive: true });
    window.addEventListener("keydown", onTouchOrClick, { passive: true });
    window.addEventListener("touchstart", onTouchOrClick, { passive: true });

    const t0 = performance.now();
    animRef.current.lastActivity = t0;
    animRef.current.lastCycle = t0;
    let prevNow = t0;
    let rafId = 0;

    // Posisi awal lengan & kepala langsung diset sebelum frame pertama agar tidak berkedip
    armLRef.current?.setAttribute("transform", "translate(105 270) scale(-1 1) rotate(30)");
    foreLRef.current?.setAttribute("transform", "translate(44 0) rotate(6)");
    armRRef.current?.setAttribute("transform", "translate(235 270) rotate(30)");
    foreRRef.current?.setAttribute("transform", "translate(44 0) rotate(6)");

    const frame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - prevNow) / 1000));
      prevNow = now;
      const step60 = dt * 60;
      const t = (now - t0) / 1000;
      const s = stateRef.current;
      const a = animRef.current;

      // Mode tidur otomatis setelah 14 detik tanpa aktivitas
      if (
        !s.isThinkingLock &&
        !s.isTypingChat &&
        !s.isSpeaking &&
        s.ekspresi !== "sleep" &&
        now - a.lastActivity > IDLE_SLEEP_MS
      ) {
        callbacksRef.current.onEkspresiOtomatis("sleep");
        callbacksRef.current.onTipBerubah("zZz... Gerakkan kursor untuk membangunkan Kiko! 😴");
      }

      // Variasi ekspresi berkala saat panel tertutup
      if (
        !s.isPanelOpen &&
        !s.isThinkingLock &&
        !s.isTypingChat &&
        s.ekspresi !== "sleep" &&
        now - a.lastCycle > CYCLE_INTERVAL_MS
      ) {
        a.lastCycle = now;
        a.cycleIdx = (a.cycleIdx + 1) % KIKO_IDLE_SEQUENCE.length;
        const item = KIKO_IDLE_SEQUENCE[a.cycleIdx];
        callbacksRef.current.onEkspresiOtomatis(item.expr);
        callbacksRef.current.onTipBerubah(item.tip);
      }

      if (reduced) {
        if (faceRef.current) {
          faceRef.current.innerHTML = bangunMarkupWajah({
            expr: s.ekspresi,
            t: 0.5,
            ox: s.isTypingChat ? -8.5 : 0,
            oy: s.isTypingChat ? 3.5 : 0,
            isSpeaking: s.isSpeaking,
          });
        }
        rafId = requestAnimationFrame(frame);
        return;
      }

      // Fisika lompatan + squash & stretch dinormalisasi 60fps
      if (a.jumpY > 0 || a.jumpV !== 0) {
        a.jumpY += a.jumpV * step60;
        a.jumpV -= 0.78 * step60;
        if (a.jumpY <= 0) {
          a.jumpY = 0;
          a.jumpV = 0;
        }
      }
      const sy = 1 + Math.max(-7, Math.min(7, a.jumpV)) * 0.011;
      const sx = 1 / Math.sqrt(sy);
      const bob = s.ekspresi === "sleep" ? Math.sin(t * 1.4) * 1.6 : Math.sin(t * 2.4) * 2.6;
      rootRef.current?.setAttribute(
        "transform",
        `translate(0 ${(bob - a.jumpY).toFixed(2)}) translate(170 350) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(-170 -350)`,
      );

      // Kepala & mata diinterpolasi halus (lerp) agar tidak pernah patah saat klik / mengetik
      const alphaHead = 1 - Math.pow(1 - 0.16, step60);
      const targetRot =
        s.ekspresi === "sleep"
          ? -4 + Math.sin(t * 1.2) * 1.2
          : s.isTypingChat
            ? -4.5
            : a.mouseX * 4 + Math.sin(t * 1.8) * 1.2;
      const targetHx = s.ekspresi === "sleep" ? -2 : s.isTypingChat ? -4 : a.mouseX * 5;
      a.headRot += (targetRot - a.headRot) * alphaHead;
      a.headX += (targetHx - a.headX) * alphaHead;
      headRef.current?.setAttribute(
        "transform",
        `translate(${a.headX.toFixed(2)} 0) rotate(${a.headRot.toFixed(2)} 170 226)`,
      );

      // Pulsa antena & LED
      const fast = s.ekspresi === "thinking" || s.ekspresi === "surprised";
      const slow = s.ekspresi === "sleep";
      const pulseSpeed = fast ? 9 : slow ? 1.5 : 3;
      antennaRef.current?.setAttribute("r", (8 + Math.sin(t * pulseSpeed) * 1.5).toFixed(2));
      ledRef.current?.setAttribute("r", (5 + Math.sin(t * pulseSpeed + 1) * 0.85).toFixed(2));

      // Ekspresi wajah & posisi mata terinterpolasi halus
      const targetOx = s.isTypingChat ? -8.5 : a.mouseX * 7;
      const targetOy = s.isTypingChat ? 3.5 : -a.mouseY * 5;
      a.eyeX += (targetOx - a.eyeX) * alphaHead;
      a.eyeY += (targetOy - a.eyeY) * alphaHead;
      if (faceRef.current) {
        faceRef.current.innerHTML = bangunMarkupWajah({
          expr: s.ekspresi,
          t,
          ox: a.eyeX,
          oy: a.eyeY,
          isSpeaking: s.isSpeaking,
        });
      }

      // Interpolasi lengan dinormalisasi 60fps
      const alphaArm = 1 - Math.pow(1 - 0.14, step60);
      const pose = poseUntukEkspresi(s.ekspresi, t);
      const specs = [
        { arm: armRRef.current, fore: foreRRef.current, x: 235, mirror: false, idx: 0 },
        { arm: armLRef.current, fore: foreLRef.current, x: 105, mirror: true, idx: 1 },
      ];
      for (const sp of specs) {
        const st = a.armsState[sp.idx];
        st.sh += (pose[sp.idx].sh - st.sh) * alphaArm;
        st.el += (pose[sp.idx].el - st.el) * alphaArm;
        sp.arm?.setAttribute(
          "transform",
          `translate(${sp.x} 270) ${sp.mirror ? "scale(-1 1)" : ""} rotate(${st.sh.toFixed(2)})`,
        );
        sp.fore?.setAttribute("transform", `translate(44 0) rotate(${st.el.toFixed(2)})`);
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onTouchOrClick);
      window.removeEventListener("keydown", onTouchOrClick);
      window.removeEventListener("touchstart", onTouchOrClick);
    };
  }, []);

  return (
    <svg
      viewBox="-5 0 350 360"
      width="78"
      height="80"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Kiko, maskot asisten interaktif Kodie"
      className={cx("block h-full w-full overflow-visible select-none", className)}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="78" y="60" width="184" height="146" rx="28" />
        </clipPath>
      </defs>
      <g ref={rootRef}>
        {/* Badan */}
        <path
          d="M118 250 L222 250 Q250 250 262 290 L276 338 Q279 350 266 350 L74 350 Q61 350 64 338 L78 290 Q90 250 118 250 Z"
          fill={C.blue}
        />
        {/* Leher */}
        <rect x="146" y="218" width="48" height="40" rx="10" fill={C.navy} />
        {/* Kerah putih + dasi navy */}
        <path d="M170 258 L128 250 L152 290 Z" fill="#fff" />
        <path d="M170 258 L212 250 L188 290 Z" fill="#fff" />
        <path d="M162 264 H178 L184 298 L170 316 L156 298 Z" fill={C.navy} />
        <rect x="161" y="258" width="18" height="14" rx="3" fill={C.navy} />
        {/* Lencana nama Kiko */}
        <g transform="translate(208 306)">
          <rect width="54" height="24" rx="8" fill="#fff" />
          <rect x="6" y="6" width="12" height="12" rx="3" fill={C.blue} />
          <rect x="8" y="8" width="8" height="8" rx="2" fill={C.navy} />
          <circle cx="12" cy="13" r="2" fill={C.lime} />
          <text
            x="23"
            y="17"
            fontFamily="var(--font-display), Inter, sans-serif"
            fontWeight="800"
            fontSize="12"
            fill={C.navy}
          >
            Kiko
          </text>
        </g>

        {/* Kepala monitor */}
        <g ref={headRef}>
          <rect x="167" y="18" width="6" height="26" rx="3" fill={C.navy} />
          <circle ref={antennaRef} cx="170" cy="16" r="8" fill={C.lime} />
          <rect x="46" y="112" width="18" height="52" rx="9" fill={C.navy} />
          <rect x="276" y="112" width="18" height="52" rx="9" fill={C.navy} />
          <rect x="58" y="40" width="224" height="186" rx="44" fill={C.blue} />
          <rect x="78" y="60" width="184" height="146" rx="28" fill={C.navy} />
          <g
            ref={faceRef}
            clipPath={`url(#${clipId})`}
            fill="none"
            stroke={C.lime}
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle ref={ledRef} cx="252" cy="214" r="5" fill={C.lime} />
        </g>

        {/* Lengan di depan badan & kepala */}
        <LenganSvg armRef={armLRef} foreRef={foreLRef} />
        <LenganSvg armRef={armRRef} foreRef={foreRRef} />
      </g>
    </svg>
  );
}
