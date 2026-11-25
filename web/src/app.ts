// User interface: aircraft selection, mass and fuel entries, limit indications at take-off and
// at landing, drawings and table.
import type { Core, Evaluation, Fleet, State } from "./core.js";
import { drawChart, drawTopView } from "./draw.js";
import { kg, m, moment, utc } from "./format.js";

/** The element with the given id; a missing element is a defect of index.html. */
function $(id: string): HTMLElement {
  const e = document.getElementById(id);
  if (e === null) throw new Error(`missing element #${id}`);
  return e;
}

/** The element with the given id, checked to be of the given class. */
function typed<T extends Element>(id: string, kind: abstract new () => T): T {
  const e = document.getElementById(id);
  if (!(e instanceof kind)) throw new Error(`missing element #${id}`);
  return e;
}

/** The first element in `parent` matching `selector`, checked to be of the given class. */
function child<T extends Element>(parent: ParentNode, selector: string, kind: abstract new () => T): T {
  const e = parent.querySelector(selector);
  if (!(e instanceof kind)) throw new Error(`missing element ${selector}`);
  return e;
}

function entryRow(id: string, name: string, label: string, unit: string): HTMLDivElement {
  const row = document.createElement("div");
  row.className = "entry";
  row.innerHTML = `<label for="${id}">${label}</label>
    <div class="field"><input id="${id}" name="${name}" type="text" inputmode="numeric" autocomplete="off" aria-describedby="${id}-msg"><span class="unit">${unit}</span></div>
    <p class="message" id="${id}-msg" aria-live="polite"></p>`;
  return row;
}

export function startApp(core: Core, typeKey: string): void {
  const fleet: Fleet = core.fleet(typeKey);
  const select = typed("aircraft", HTMLSelectElement);
  for (const a of fleet.aircraft) select.append(new Option(a.id, a.id));
  const entriesBox = $("entries");
  const inputs: HTMLInputElement[] = [];
  const messages: HTMLElement[] = [];
  for (const s of fleet.type.stations) {
    const row = entryRow(`entry-${s.key}`, s.key, `${s.name} (max ${s.maxKg} kg)`, "kg");
    entriesBox.append(row);
    const input = child(row, "input", HTMLInputElement);
    inputs.push(input);
    messages.push(child(row, ".message", HTMLElement));
    input.addEventListener("input", update);
  }
  const fuelBox = $("fuel-entries");
  const fuelRow = entryRow("entry-fuel", "fuel", `Usable fuel at take-off (max ${fleet.type.fuelCapacityL} L)`, "L");
  const burnRow = entryRow("entry-burn", "burn", "Planned fuel burn", "L");
  const fuelReport = document.createElement("p");
  fuelReport.className = "data";
  fuelReport.id = "fuel-report";
  const fuelNote = document.createElement("p");
  fuelNote.className = "note";
  fuelNote.id = "fuel-note";
  fuelRow.append(fuelReport, fuelNote);
  fuelBox.append(fuelRow, burnRow);
  const fuelInput = child(fuelRow, "input", HTMLInputElement);
  const burnInput = child(burnRow, "input", HTMLInputElement);
  const allInputs = [...inputs, fuelInput, burnInput];
  fuelInput.addEventListener("input", update);
  burnInput.addEventListener("input", update);

  const corners = child($("corners"), "tbody", HTMLTableSectionElement);
  fleet.type.envelope.forEach(([mass, cg], i) => {
    const tr = document.createElement("tr");
    for (const [j, v] of [String(i + 1), kg(mass), m(cg)].entries()) {
      const td = document.createElement(j === 0 ? "th" : "td");
      if (j === 0) td.setAttribute("scope", "row");
      td.textContent = v;
      tr.append(td);
    }
    corners.append(tr);
  });
  $("offline").textContent = `Offline: aircraft data as of ${fleet.dataDate}. Check the weighing date against the aircraft documents.`;
  const offline = (): void => {
    $("offline").hidden = navigator.onLine;
  };
  addEventListener("online", offline);
  addEventListener("offline", offline);
  offline();

  select.addEventListener("change", () => {
    for (const inp of allInputs) inp.value = "";
    const a = fleet.aircraft.find((x) => x.id === select.value);
    if (a !== undefined && a.reportedFuelL !== null) fuelInput.value = String(a.reportedFuelL);
    update();
  });

  function update(): void {
    const a = fleet.aircraft.find((x) => x.id === select.value);
    $("select-hint").hidden = a !== undefined;
    $("aircraft-info").hidden = a === undefined;
    $("work").hidden = a === undefined;
    if (a === undefined) return;
    $("selected").textContent = `${a.id} · ${fleet.type.name}`;
    $("empty-data").textContent = `Empty mass ${kg(a.emptyKg)} at ${m(a.emptyArmMm)}, weighed ${a.weighingDate}`;
    $("mtom").textContent = `Maximum take-off mass ${kg(fleet.type.mtomKg)}`;
    $("result-aircraft").textContent = `For ${a.id}`;
    fuelReport.textContent = a.reportedFuelL === null ? "No report of the fuel system module" : `Reported by the fuel system module: ${a.reportedFuelL} L at ${utc(a.reportedAt ?? "")}`;
    const own = fuelInput.value.trim() !== "" && fuelInput.value.trim() !== String(a.reportedFuelL);
    fuelNote.textContent = own ? `Pilot's figure (fuel system module reported ${String(a.reportedFuelL)} L)` : "";
    fuelNote.hidden = !own;
    const e = core.evaluate(typeKey, a.id, inputs.map((i) => i.value), fuelInput.value, burnInput.value);
    render(e);
    const active = document.activeElement;
    if (active instanceof HTMLInputElement && allInputs.includes(active)) active.scrollIntoView({ block: "nearest" });
  }

  function showState(prefix: string, s: State, complete: boolean): void {
    const ind = $(prefix === "to" ? "indication" : "landing-indication");
    ind.replaceChildren(...s.indications.map((t) => Object.assign(document.createElement("span"), { textContent: t })));
    $(prefix === "to" ? "result-to" : "result-ldg").dataset["state"] = !complete ? "incomplete" : s.within ? "within" : "outside";
  }

  function render(e: Evaluation): void {
    const all = [...e.entries, e.fuel, e.burn];
    const msgs = [...messages, $("entry-fuel-msg"), $("entry-burn-msg")];
    const anyFilled = allInputs.some((j) => j.value !== "");
    all.forEach((x, i) => {
      const msg = msgs[i];
      const input = allInputs[i];
      if (msg === undefined || input === undefined) return;
      const text = x.message ?? "";
      if (msg.textContent !== text) msg.textContent = text;
      const invalid = x.message !== null && x.message !== "";
      input.setAttribute("aria-invalid", String(invalid || (!e.complete && x.empty)));
      input.classList.toggle("invalid", invalid);
      input.classList.toggle("missing", !e.complete && x.empty && anyFilled);
    });
    showState("to", e.takeOff, e.complete);
    showState("ldg", e.landing, e.complete);
    $("result").dataset["state"] = !e.complete ? "incomplete" : e.takeOff.within && e.landing.within ? "within" : "outside";
    $("figures").hidden = !e.complete;
    $("total").textContent = e.complete ? kg(e.takeOff.totalKg) : "";
    $("cg").textContent = e.complete ? m(e.takeOff.cgMm) : "";
    $("landing-figures").textContent = e.complete ? `Landing ${kg(e.landing.totalKg)} at ${m(e.landing.cgMm)}` : "";
    const marks = e.entries.map((x, i) => (x.valid ? kg(Number(inputs[i]?.value.trim())) : null));
    drawTopView(typed("topview", SVGSVGElement), fleet.type, marks, e.fuel.valid ? `${Number(fuelInput.value.trim())} L` : null);
    drawChart(typed("chart", SVGSVGElement), fleet.type, e);
    const body = child($("table"), "tbody", HTMLTableSectionElement);
    body.replaceChildren();
    if (e.complete) {
      const total = { name: "Total at take-off", litres: null, kg: e.takeOff.totalKg, armMm: e.takeOff.cgMm, momentTenths: e.takeOff.momentTenths };
      const totalLdg = { name: "Total at landing", litres: null, kg: e.landing.totalKg, armMm: e.landing.cgMm, momentTenths: e.landing.momentTenths };
      for (const r of [...e.rows, total, e.landingFuel, totalLdg]) {
        const tr = document.createElement("tr");
        if (r === total || r === totalLdg) tr.className = "total";
        const name = r.litres === null ? r.name : `${r.name} ${r.litres} L`;
        for (const [i, v] of [name, kg(r.kg), m(r.armMm), moment(r.momentTenths)].entries()) {
          const td = document.createElement(i === 0 ? "th" : "td");
          if (i === 0) td.setAttribute("scope", "row");
          td.textContent = v;
          tr.append(td);
        }
        body.append(tr);
      }
    }
    $("table").hidden = !e.complete;
    $("rounding").hidden = !e.complete;
  }

  update();
}
