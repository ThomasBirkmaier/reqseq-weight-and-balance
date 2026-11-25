// The result card (limit indications at take-off and at landing), the calculation table and the
// table of the envelope corners.
import type { AircraftType, Evaluation, Row, State } from "./core.js";
import { $, child, tableRow } from "./dom.js";
import { kg, m, moment } from "./format.js";

/** The state of a result for its styling: incomplete, within or outside the limits. */
function resultState(complete: boolean, within: boolean): string {
  if (!complete) return "incomplete";
  return within ? "within" : "outside";
}

/** Shows the indications of one state of the flight (take-off or landing). */
function showState(indicationId: string, cardId: string, s: State, complete: boolean): void {
  const spans = s.indications.map((t) => Object.assign(document.createElement("span"), { textContent: t }));
  $(indicationId).replaceChildren(...spans);
  $(cardId).dataset["state"] = resultState(complete, s.within);
}

/** Shows the result card: both indications and, for a complete check, the total mass and centre of gravity. */
export function showResult(e: Evaluation): void {
  showState("indication", "result-to", e.takeOff, e.complete);
  showState("landing-indication", "result-ldg", e.landing, e.complete);
  $("result").dataset["state"] = resultState(e.complete, e.takeOff.within && e.landing.within);
  $("figures").hidden = !e.complete;
  $("total").textContent = e.complete ? kg(e.takeOff.totalKg) : "";
  $("cg").textContent = e.complete ? m(e.takeOff.cgMm) : "";
  $("landing-figures").textContent = e.complete ? `Landing ${kg(e.landing.totalKg)} at ${m(e.landing.cgMm)}` : "";
}

/** The total row of one state of the flight. */
function totalRow(name: string, s: State): Row {
  return { name, litres: null, kg: s.totalKg, armMm: s.cgMm, momentTenths: s.momentTenths };
}

/** Shows the calculation table (take-off rows, totals and the fuel at landing) for a complete check. */
export function showTable(e: Evaluation): void {
  const body = child($("table"), "tbody", HTMLTableSectionElement);
  body.replaceChildren();
  if (e.complete) {
    const total = totalRow("Total at take-off", e.takeOff);
    const totalLdg = totalRow("Total at landing", e.landing);
    for (const r of [...e.rows, total, e.landingFuel, totalLdg]) {
      const name = r.litres === null ? r.name : `${r.name} ${r.litres} L`;
      const cells = [name, kg(r.kg), m(r.armMm), moment(r.momentTenths)];
      body.append(tableRow(cells, r === total || r === totalLdg ? "total" : ""));
    }
  }
  $("table").hidden = !e.complete;
  $("rounding").hidden = !e.complete;
}

/** Fills the table of the envelope corners (number, mass, centre of gravity). */
export function showCorners(t: AircraftType): void {
  const corners = child($("corners"), "tbody", HTMLTableSectionElement);
  t.envelope.forEach(([mass, cg], i) => {
    corners.append(tableRow([String(i + 1), kg(mass), m(cg)]));
  });
}
