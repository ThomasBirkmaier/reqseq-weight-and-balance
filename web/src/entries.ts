// The entries of the pilot: one mass entry per loading station, the usable fuel at take-off and
// the planned fuel burn, each with its message line below.
import type { Aircraft, Evaluation, Fleet } from "./core.js";
import { $, child } from "./dom.js";
import { utc } from "./format.js";

/** The entry fields of the page, in the order of the core's evaluation (stations, fuel, burn). */
export interface Entries {
  /** One mass entry per loading station. */
  readonly stations: readonly HTMLInputElement[];
  /** Usable fuel at take-off (L). */
  readonly fuel: HTMLInputElement;
  /** Planned fuel burn (L). */
  readonly burn: HTMLInputElement;
  /** Every entry: the stations, then fuel and burn. */
  readonly all: readonly HTMLInputElement[];
  /** The message line of every entry, in the order of `all`. */
  readonly messages: readonly HTMLElement[];
  /** The fuel quantity reported by the fuel system module. */
  readonly fuelReport: HTMLElement;
  /** The note shown when the pilot's figure differs from the report. */
  readonly fuelNote: HTMLElement;
}

/** One labelled entry with its unit and its (polite, live) message line. */
function entryRow(id: string, name: string, label: string, unit: string): HTMLDivElement {
  const row = document.createElement("div");
  row.className = "entry";
  row.innerHTML = `<label for="${id}">${label}</label>
    <div class="field"><input id="${id}" name="${name}" type="text" inputmode="numeric" autocomplete="off" aria-describedby="${id}-msg"><span class="unit">${unit}</span></div>
    <p class="message" id="${id}-msg" aria-live="polite"></p>`;
  return row;
}

/** A paragraph with the given class and id. */
function paragraph(className: string, id: string): HTMLParagraphElement {
  const p = document.createElement("p");
  p.className = className;
  p.id = id;
  return p;
}

/** Builds the entries of the fleet's aircraft type; `onInput` runs after every change. */
export function buildEntries(fleet: Fleet, onInput: () => void): Entries {
  const stations: HTMLInputElement[] = [];
  const messages: HTMLElement[] = [];
  for (const s of fleet.type.stations) {
    const row = entryRow(`entry-${s.key}`, s.key, `${s.name} (max ${s.maxKg} kg)`, "kg");
    $("entries").append(row);
    stations.push(child(row, "input", HTMLInputElement));
    messages.push(child(row, ".message", HTMLElement));
  }
  const fuelRow = entryRow("entry-fuel", "fuel", `Usable fuel at take-off (max ${fleet.type.fuelCapacityL} L)`, "L");
  const burnRow = entryRow("entry-burn", "burn", "Planned fuel burn", "L");
  const fuelReport = paragraph("data", "fuel-report");
  const fuelNote = paragraph("note", "fuel-note");
  fuelRow.append(fuelReport, fuelNote);
  $("fuel-entries").append(fuelRow, burnRow);
  const fuel = child(fuelRow, "input", HTMLInputElement);
  const burn = child(burnRow, "input", HTMLInputElement);
  messages.push(child(fuelRow, ".message", HTMLElement), child(burnRow, ".message", HTMLElement));
  const all = [...stations, fuel, burn];
  for (const input of all) input.addEventListener("input", onInput);
  return { stations, fuel, burn, all, messages, fuelReport, fuelNote };
}

/** Shows the fuel report of the aircraft and marks the usable fuel as the pilot's figure when it differs. */
export function showFuelReport(entries: Entries, a: Aircraft): void {
  entries.fuelReport.textContent =
    a.reportedFuelL === null
      ? "No report of the fuel system module"
      : `Reported by the fuel system module: ${a.reportedFuelL} L at ${utc(a.reportedAt ?? "")}`;
  const figure = entries.fuel.value.trim();
  const own = figure !== "" && figure !== String(a.reportedFuelL);
  entries.fuelNote.textContent = own ? `Pilot's figure (fuel system module reported ${String(a.reportedFuelL)} L)` : "";
  entries.fuelNote.hidden = !own;
}

/** Shows each entry's message and marks invalid entries, and empty ones once anything is filled in. */
export function showEntryStates(entries: Entries, e: Evaluation): void {
  const anyFilled = entries.all.some((j) => j.value !== "");
  [...e.entries, e.fuel, e.burn].forEach((x, i) => {
    const msg = entries.messages[i];
    const input = entries.all[i];
    if (msg === undefined || input === undefined) return;
    const text = x.message ?? "";
    if (msg.textContent !== text) msg.textContent = text;
    const invalid = x.message !== null && x.message !== "";
    input.setAttribute("aria-invalid", String(invalid || (!e.complete && x.empty)));
    input.classList.toggle("invalid", invalid);
    input.classList.toggle("missing", !e.complete && x.empty && anyFilled);
  });
}
