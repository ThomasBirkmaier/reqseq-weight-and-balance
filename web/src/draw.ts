// SVG drawings: top view of the aircraft with its loading stations, and the envelope chart.
import type { AircraftType, Evaluation, State } from "./core.js";
import { kg, m } from "./format.js";

const NS = "http://www.w3.org/2000/svg";

function el<K extends keyof SVGElementTagNameMap>(
  name: K,
  attrs: Record<string, string | number>,
  text?: string,
): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  if (text !== undefined) e.textContent = text;
  return e;
}

/** Top view: fuselage along the vertical axis, nose at the top; stations placed by lever arm. */
export function drawTopView(svg: SVGSVGElement, t: AircraftType, labels: (string | null)[], fuel: string | null): void {
  svg.replaceChildren();
  const arms = [...t.stations.map((s) => s.armMm), t.fuelArmMm];
  const y = (arm: number): number => 70 + ((arm - 1500) / (Math.max(...arms, 3000) - 1500 + 500)) * 300;
  // fuselage, wing, tail
  const frame = el("g", { transform: "translate(-40 0)" });
  frame.append(
    el("path", {
      d: "M160 18 C178 18 188 40 190 70 L196 330 C196 360 176 400 160 404 C144 400 124 360 124 330 L130 70 C132 40 142 18 160 18 Z",
      class: "airframe",
    }),
  );
  frame.append(el("rect", { x: 50, y: y(2350) - 18, width: 220, height: 40, rx: 10, class: "airframe" }));
  frame.append(el("rect", { x: 100, y: 372, width: 120, height: 18, rx: 6, class: "airframe" }));
  svg.append(frame);
  // Loading stations and the fuel tanks, ordered from front to back by lever arm.
  const marks = [
    ...t.stations.map((s, i) => ({ key: s.key, name: s.name, arm: s.armMm, value: labels[i] ?? null })),
    { key: "fuel", name: "Usable fuel", arm: t.fuelArmMm, value: fuel },
  ].sort((a, b) => a.arm - b.arm);
  marks.forEach((s, i) => {
    const cy = y(s.arm);
    const g = el("g", { class: "station", "data-station": s.key, "data-order": i });
    const loaded = s.value !== null && !s.value.startsWith("0 ");
    g.append(el("rect", { x: 92, y: cy - 14, width: 56, height: 28, rx: 6, class: loaded ? "mark loaded" : "mark" }));
    const value = s.value ?? "–";
    const t1 = el("text", { x: 158, y: cy - 2, class: "mark-label", "aria-label": `${s.name} ${value}` });
    t1.append(el("tspan", { x: 158, dy: 0 }, s.name), el("tspan", { x: 158, dy: 16, class: "mark-value" }, value));
    g.append(t1);
    svg.append(g);
  });
  svg.append(el("text", { x: 120, y: 12, "text-anchor": "middle", class: "axis" }, "Nose"));
}

/** Size of the chart and its margins in SVG units (viewBox 340 × 260). */
const CHART = { width: 340, height: 260, left: 52, right: 14, top: 14, bottom: 40 } as const;

/** The scale of the chart: SVG coordinates for a centre of gravity (mm) and a mass (kg). */
interface Scale {
  /** Lowest and highest centre of gravity shown, in mm. */
  readonly cMin: number;
  readonly cMax: number;
  /** Lowest and highest mass shown, in kg. */
  readonly mMin: number;
  readonly mMax: number;
  /** Horizontal coordinate of a centre of gravity in mm. */
  readonly x: (c: number) => number;
  /** Vertical coordinate of a total mass in kg. */
  readonly y: (mass: number) => number;
}

/** The scale that shows the envelope with a margin on every side. */
function scaleOf(t: AircraftType): Scale {
  const { width: W, height: H, left: L, right: R, top: T, bottom: B } = CHART;
  const cgs = t.envelope.map((p) => p[1]);
  const ms = t.envelope.map((p) => p[0]);
  const cMin = Math.min(...cgs) - 60;
  const cMax = Math.max(...cgs) + 60;
  const mMin = Math.min(...ms) - 50;
  const mMax = Math.max(...ms) + 80;
  return {
    cMin,
    cMax,
    mMin,
    mMax,
    x: (c) => L + ((c - cMin) / (cMax - cMin)) * (W - L - R),
    y: (mass) => H - B - ((mass - mMin) / (mMax - mMin)) * (H - T - B),
  };
}

/** Axes with ticks every 0.1 m and every 100 kg, and their titles. */
function drawAxes(svg: SVGSVGElement, s: Scale): void {
  const { width: W, height: H, left: L, right: R, top: T, bottom: B } = CHART;
  svg.append(el("line", { x1: L, y1: H - B, x2: W - R, y2: H - B, class: "axis-line" }));
  svg.append(el("line", { x1: L, y1: T, x2: L, y2: H - B, class: "axis-line" }));
  for (let c = Math.ceil(s.cMin / 100) * 100; c <= s.cMax; c += 100) {
    svg.append(el("text", { x: s.x(c), y: H - B + 16, "text-anchor": "middle", class: "axis" }, (c / 1000).toFixed(1)));
  }
  for (let mass = Math.ceil(s.mMin / 100) * 100; mass <= s.mMax; mass += 100) {
    svg.append(el("text", { x: L - 6, y: s.y(mass) + 4, "text-anchor": "end", class: "axis" }, String(mass)));
  }
  const middle = { x: (L + W - R) / 2, y: (T + H - B) / 2 };
  svg.append(el("text", { x: middle.x, y: H - 6, "text-anchor": "middle", class: "axis" }, "Centre of gravity (m)"));
  const rotate = `rotate(-90 12 ${middle.y})`;
  svg.append(
    el("text", { x: 12, y: middle.y, "text-anchor": "middle", class: "axis", transform: rotate }, "Total mass (kg)"),
  );
}

/** One state of the flight as a point: circle (take-off) or square (landing) inside, cross outside. */
function drawPoint(svg: SVGSVGElement, s: Scale, st: State, id: string, name: string): { px: number; py: number } {
  const px = s.x(st.cgExactMm);
  const py = s.y(st.totalKg);
  const outside = !st.within;
  const g = el("g", { id, "data-mass": st.totalKg, "data-cg": st.cgMm, "data-state": outside ? "outside" : "inside" });
  if (outside) {
    const d = `M${px - 7} ${py - 7} L${px + 7} ${py + 7} M${px + 7} ${py - 7} L${px - 7} ${py + 7}`;
    g.append(el("path", { d, class: "point outside" }));
  } else if (id === "point") {
    g.append(el("circle", { cx: px, cy: py, r: 6, class: "point" }));
  } else {
    g.append(el("rect", { x: px - 5, y: py - 5, width: 10, height: 10, class: "point landing" }));
  }
  g.append(el("title", {}, `${name} ${kg(st.totalKg)}, ${m(st.cgMm)}`));
  svg.append(g);
  return { px, py };
}

/** The label next to a take-off point outside the limits; empty when it is within. */
function limitLabel(st: State): string {
  if (st.cgState === "aft") return "Aft limit exceeded";
  if (st.cgState === "forward") return "Forward limit exceeded";
  return st.massExceeded ? "Mass limit exceeded" : "";
}

/** Envelope chart: centre of gravity (m) horizontal, total mass (kg) vertical. */
export function drawChart(svg: SVGSVGElement, t: AircraftType, e: Evaluation | null): void {
  svg.replaceChildren();
  const s = scaleOf(t);
  drawAxes(svg, s);
  const points = t.envelope.map(([mass, c]) => `${s.x(c).toFixed(1)},${s.y(mass).toFixed(1)}`).join(" ");
  const corners = t.envelope.map(([mass, c]) => `${mass}:${c}`).join(" ");
  svg.append(el("polygon", { points, class: "envelope", "data-corners": corners }));
  if (e?.complete !== true) return;
  const ldg = drawPoint(svg, s, e.landing, "point-landing", "Landing");
  const to = drawPoint(svg, s, e.takeOff, "point", "Take-off");
  svg.append(el("line", { x1: to.px, y1: to.py, x2: ldg.px, y2: ldg.py, class: "burn-line" }));
  const label = limitLabel(e.takeOff);
  if (label !== "") {
    const anchor = to.px > CHART.width / 2 ? "end" : "start";
    const attrs = { x: to.px + (anchor === "end" ? -10 : 10), y: to.py + 24, "text-anchor": anchor };
    svg.append(el("text", { ...attrs, class: "point-label", id: "point-label" }, label));
  }
}
