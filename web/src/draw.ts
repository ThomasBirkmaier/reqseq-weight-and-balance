// SVG drawings: top view of the aircraft with its loading stations, and the envelope chart.
import type { AircraftType, Evaluation } from "./core.js";
import { kg, m } from "./format.js";

const NS = "http://www.w3.org/2000/svg";

function el<K extends keyof SVGElementTagNameMap>(name: K, attrs: Record<string, string | number>, text?: string): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  if (text !== undefined) e.textContent = text;
  return e;
}

/** Top view: fuselage along the vertical axis, nose at the top; stations placed by lever arm. */
export function drawTopView(svg: SVGSVGElement, t: AircraftType, masses: (number | null)[]): void {
  svg.replaceChildren();
  const arms = t.stations.map((s) => s.armMm);
  const y = (arm: number) => 70 + ((arm - 1500) / (Math.max(...arms, 3000) - 1500 + 500)) * 300;
  // fuselage, wing, tail
  const frame = el("g", { transform: "translate(-40 0)" });
  frame.append(el("path", { d: "M160 18 C178 18 188 40 190 70 L196 330 C196 360 176 400 160 404 C144 400 124 360 124 330 L130 70 C132 40 142 18 160 18 Z", class: "airframe" }));
  frame.append(el("rect", { x: 50, y: y(2350) - 18, width: 220, height: 40, rx: 10, class: "airframe" }));
  frame.append(el("rect", { x: 100, y: 372, width: 120, height: 18, rx: 6, class: "airframe" }));
  svg.append(frame);
  t.stations.forEach((s, i) => {
    const cy = y(s.armMm);
    const g = el("g", { class: "station", "data-station": s.key, "data-order": i });
    g.append(el("rect", { x: 92, y: cy - 14, width: 56, height: 28, rx: 6, class: masses[i] ? "mark loaded" : "mark" }));
    const value = masses[i] === null ? "–" : kg(masses[i] as number);
    const t1 = el("text", { x: 158, y: cy - 2, class: "mark-label", "aria-label": `${s.name} ${value}` });
    t1.append(el("tspan", { x: 158, dy: 0 }, s.name), el("tspan", { x: 158, dy: 16, class: "mark-value" }, value));
    g.append(t1);
    svg.append(g);
  });
  svg.append(el("text", { x: 120, y: 12, "text-anchor": "middle", class: "axis" }, "Nose"));
}

/** Envelope chart: centre of gravity (m) horizontal, total mass (kg) vertical. */
export function drawChart(svg: SVGSVGElement, t: AircraftType, e: Evaluation | null): void {
  svg.replaceChildren();
  const W = 340, H = 260, L = 52, R = 14, T = 14, B = 40;
  const cgs = t.envelope.map((p) => p[1]);
  const ms = t.envelope.map((p) => p[0]);
  const cMin = Math.min(...cgs) - 60, cMax = Math.max(...cgs) + 60;
  const mMin = Math.min(...ms) - 50, mMax = Math.max(...ms) + 80;
  const x = (c: number) => L + ((c - cMin) / (cMax - cMin)) * (W - L - R);
  const y = (mass: number) => H - B - ((mass - mMin) / (mMax - mMin)) * (H - T - B);
  // axes
  svg.append(el("line", { x1: L, y1: H - B, x2: W - R, y2: H - B, class: "axis-line" }));
  svg.append(el("line", { x1: L, y1: T, x2: L, y2: H - B, class: "axis-line" }));
  for (let c = Math.ceil(cMin / 100) * 100; c <= cMax; c += 100) {
    svg.append(el("text", { x: x(c), y: H - B + 16, "text-anchor": "middle", class: "axis" }, (c / 1000).toFixed(1)));
  }
  for (let mass = Math.ceil(mMin / 100) * 100; mass <= mMax; mass += 100) {
    svg.append(el("text", { x: L - 6, y: y(mass) + 4, "text-anchor": "end", class: "axis" }, String(mass)));
  }
  svg.append(el("text", { x: (L + W - R) / 2, y: H - 6, "text-anchor": "middle", class: "axis" }, "Centre of gravity (m)"));
  svg.append(el("text", { x: 12, y: (T + H - B) / 2, "text-anchor": "middle", class: "axis", transform: `rotate(-90 12 ${(T + H - B) / 2})` }, "Total mass (kg)"));
  const pts = t.envelope.map(([mass, c]) => `${x(c).toFixed(1)},${y(mass).toFixed(1)}`).join(" ");
  svg.append(el("polygon", { points: pts, class: "envelope", "data-corners": t.envelope.map(([mass, c]) => `${mass}:${c}`).join(" ") }));
  if (!e || !e.complete) return;
  const px = x(e.cgExactMm), py = y(e.totalKg);
  const outside = !e.within;
  const label = e.cgState === "aft" ? "Aft limit exceeded" : e.cgState === "forward" ? "Forward limit exceeded" : e.massExceeded ? "Mass limit exceeded" : "";
  const g = el("g", { id: "point", "data-mass": e.totalKg, "data-cg": e.cgMm, "data-state": outside ? "outside" : "inside" });
  if (outside) {
    g.append(el("path", { d: `M${px - 7} ${py - 7} L${px + 7} ${py + 7} M${px + 7} ${py - 7} L${px - 7} ${py + 7}`, class: "point outside" }));
  } else {
    g.append(el("circle", { cx: px, cy: py, r: 6, class: "point" }));
  }
  g.append(el("title", {}, `${kg(e.totalKg)}, ${m(e.cgMm)}`));
  svg.append(g);
  if (label) {
    const anchor = px > W / 2 ? "end" : "start";
    svg.append(el("text", { x: px + (anchor === "end" ? -10 : 10), y: py + 24, "text-anchor": anchor, class: "point-label", id: "point-label" }, label));
  }
}
