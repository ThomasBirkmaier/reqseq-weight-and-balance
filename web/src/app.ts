// User interface: aircraft selection, mass and fuel entries, limit indications at take-off and
// at landing, drawings and table. This module wires the parts together; each part has its module.
import type { Aircraft, Core, Evaluation, Fleet } from "./core.js";
import { $, typed } from "./dom.js";
import { drawChart, drawTopView } from "./draw.js";
import { buildEntries, showEntryStates, showFuelReport, type Entries } from "./entries.js";
import { kg, m } from "./format.js";
import { showCorners, showResult, showTable } from "./result.js";

/** Shows the offline notice with the date of the aircraft data while the device has no network. */
function watchOffline(dataDate: string): void {
  $("offline").textContent =
    `Offline: aircraft data as of ${dataDate}. Check the weighing date against the aircraft documents.`;
  const offline = (): void => {
    $("offline").hidden = navigator.onLine;
  };
  addEventListener("online", offline);
  addEventListener("offline", offline);
  offline();
}

/** Shows the data of the selected aircraft above the entries. */
function showAircraft(fleet: Fleet, a: Aircraft): void {
  $("selected").textContent = `${a.id} · ${fleet.type.name}`;
  $("empty-data").textContent = `Empty mass ${kg(a.emptyKg)} at ${m(a.emptyArmMm)}, weighed ${a.weighingDate}`;
  $("mtom").textContent = `Maximum take-off mass ${kg(fleet.type.mtomKg)}`;
  $("result-aircraft").textContent = `For ${a.id}`;
}

/** Shows one evaluation: entry states, result card, drawings and table. */
function render(fleet: Fleet, entries: Entries, e: Evaluation): void {
  showEntryStates(entries, e);
  showResult(e);
  const marks = e.entries.map((x, i) => (x.valid ? kg(Number(entries.stations[i]?.value.trim())) : null));
  const fuel = e.fuel.valid ? `${Number(entries.fuel.value.trim())} L` : null;
  drawTopView(typed("topview", SVGSVGElement), fleet.type, marks, fuel);
  drawChart(typed("chart", SVGSVGElement), fleet.type, e);
  showTable(e);
}

/** Starts the app for the build's aircraft type: every entry updates the result at once, without a button. */
export function startApp(core: Core, typeKey: string): void {
  const fleet: Fleet = core.fleet(typeKey);
  const select = typed("aircraft", HTMLSelectElement);
  for (const a of fleet.aircraft) select.append(new Option(a.id, a.id));
  const selected = (): Aircraft | undefined => fleet.aircraft.find((x) => x.id === select.value);

  const update = (): void => {
    const a = selected();
    $("select-hint").hidden = a !== undefined;
    $("aircraft-info").hidden = a === undefined;
    $("work").hidden = a === undefined;
    if (a === undefined) return;
    showAircraft(fleet, a);
    showFuelReport(entries, a);
    const values = entries.stations.map((i) => i.value);
    render(fleet, entries, core.evaluate(typeKey, a.id, values, entries.fuel.value, entries.burn.value));
    const active = document.activeElement;
    if (active instanceof HTMLInputElement && entries.all.includes(active)) active.scrollIntoView({ block: "nearest" });
  };
  const entries = buildEntries(fleet, update);
  showCorners(fleet.type);
  watchOffline(fleet.dataDate);

  select.addEventListener("change", () => {
    for (const inp of entries.all) inp.value = "";
    const a = selected();
    if (a !== undefined && a.reportedFuelL !== null) entries.fuel.value = String(a.reportedFuelL);
    update();
  });
  update();
}
