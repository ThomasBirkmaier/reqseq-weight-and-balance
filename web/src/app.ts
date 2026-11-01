// User interface: aircraft selection, mass entries, limit indication, drawings and table.
import type { Core, Evaluation, Fleet } from "./core.js";
import { drawChart, drawTopView } from "./draw.js";
import { kg, m, moment } from "./format.js";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

export function startApp(core: Core, typeKey: string): void {
  const fleet: Fleet = core.fleet(typeKey);
  const select = $<HTMLSelectElement>("aircraft");
  for (const a of fleet.aircraft) select.append(new Option(a.id, a.id));
  const entriesBox = $("entries");
  const inputs: HTMLInputElement[] = [];
  const messages: HTMLElement[] = [];
  fleet.type.stations.forEach((s, i) => {
    const row = document.createElement("div");
    row.className = "entry";
    const id = `entry-${s.key}`;
    row.innerHTML = `<label for="${id}">${s.name} (max ${s.maxKg} kg)</label>
      <div class="field"><input id="${id}" name="${s.key}" type="text" inputmode="numeric" autocomplete="off" aria-describedby="${id}-msg"><span class="unit">kg</span></div>
      <p class="message" id="${id}-msg" role="alert"></p>`;
    entriesBox.append(row);
    inputs[i] = row.querySelector("input")!;
    messages[i] = row.querySelector(".message")!;
    inputs[i].addEventListener("input", update);
  });

  select.addEventListener("change", () => {
    for (const inp of inputs) inp.value = "";
    update();
  });

  function update(): void {
    const a = fleet.aircraft.find((x) => x.id === select.value);
    $("select-hint").hidden = !!a;
    $("aircraft-info").hidden = !a;
    $("work").hidden = !a;
    if (!a) return;
    $("selected").textContent = `${a.id} · ${fleet.type.name}`;
    $("empty-data").textContent = `Empty mass ${kg(a.emptyKg)} at ${m(a.emptyArmMm)}, weighed ${a.weighingDate}`;
    $("mtom").textContent = `Maximum take-off mass ${kg(fleet.type.mtomKg)}`;
    const e = core.evaluate(typeKey, a.id, inputs.map((i) => i.value));
    render(e);
  }

  function render(e: Evaluation): void {
    e.entries.forEach((x, i) => {
      messages[i].textContent = x.message ?? "";
      inputs[i].setAttribute("aria-invalid", String(!!x.message || (!e.complete && x.empty)));
      inputs[i].classList.toggle("invalid", !!x.message);
      inputs[i].classList.toggle("missing", !e.complete && x.empty && inputs.some((j) => j.value !== ""));
    });
    const ind = $("indication");
    ind.replaceChildren(...e.indications.map((t) => Object.assign(document.createElement("span"), { textContent: t })));
    const state = !e.complete ? "incomplete" : e.within ? "within" : "outside";
    $("result").dataset.state = state;
    $("figures").hidden = !e.complete;
    $("total").textContent = e.complete ? kg(e.totalKg) : "";
    $("cg").textContent = e.complete ? m(e.cgMm) : "";
    drawTopView($("topview") as unknown as SVGSVGElement, fleet.type, e.entries.map((x, i) => (x.valid ? Number(inputs[i].value.trim()) : null)));
    drawChart($("chart") as unknown as SVGSVGElement, fleet.type, e);
    const body = $("table").querySelector("tbody")!;
    body.replaceChildren();
    if (e.complete) {
      for (const r of [...e.rows, { name: "Total", kg: e.totalKg, armMm: e.cgMm, momentTenths: e.momentTenths }]) {
        const tr = document.createElement("tr");
        if (r.name === "Total") tr.className = "total";
        for (const [i, v] of [r.name, kg(r.kg), m(r.armMm), moment(r.momentTenths)].entries()) {
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
