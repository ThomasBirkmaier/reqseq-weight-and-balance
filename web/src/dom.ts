// Small helpers for the page: elements by id with a type check, and table rows.

/** The element with the given id; a missing element is a defect of index.html. */
export function $(id: string): HTMLElement {
  const e = document.getElementById(id);
  if (e === null) throw new Error(`missing element #${id}`);
  return e;
}

/** The element with the given id, checked to be of the given class. */
export function typed<T extends Element>(id: string, kind: abstract new () => T): T {
  const e = document.getElementById(id);
  if (!(e instanceof kind)) throw new Error(`missing element #${id}`);
  return e;
}

/** The first element in `parent` matching `selector`, checked to be of the given class. */
export function child<T extends Element>(parent: ParentNode, selector: string, kind: abstract new () => T): T {
  const e = parent.querySelector(selector);
  if (!(e instanceof kind)) throw new Error(`missing element ${selector}`);
  return e;
}

/** A table row: the first cell is the row header (`th scope="row"`), the others are data cells. */
export function tableRow(cells: readonly string[], className = ""): HTMLTableRowElement {
  const tr = document.createElement("tr");
  if (className !== "") tr.className = className;
  cells.forEach((v, i) => {
    const td = document.createElement(i === 0 ? "th" : "td");
    if (i === 0) td.setAttribute("scope", "row");
    td.textContent = v;
    tr.append(td);
  });
  return tr;
}
