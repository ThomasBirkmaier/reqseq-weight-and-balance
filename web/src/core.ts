// Loader of the WebAssembly calculation core and its JSON interface.
import { arrayOf, checked, isBoolean, isNumber, isPair, isString, nullable, objectOf, oneOf, type Guard } from "./guard.js";

export interface Station { key: string; name: string; armMm: number; maxKg: number }
export interface AircraftType { key: string; name: string; mtomKg: number; stations: Station[]; envelope: [number, number][]; fuelArmMm: number; fuelCapacityL: number }
export interface Aircraft { id: string; emptyKg: number; emptyArmMm: number; weighingDate: string; reportedFuelL: number | null; reportedAt: string | null }
export interface Fleet { type: AircraftType; aircraft: Aircraft[] }
export interface EntryResult { valid: boolean; empty: boolean; message: string | null }
export interface Row { name: string; litres: number | null; kg: number; armMm: number; momentTenths: number }
/** Result of the limit check rule for one state of the flight. */
export interface State {
  totalKg: number;
  momentTenths: number;
  cgMm: number;
  cgExactMm: number;
  massExceeded: boolean;
  massBelow: boolean;
  cgState: "within" | "forward" | "aft";
  fwdLimitMm: number;
  aftLimitMm: number;
  within: boolean;
  indications: string[];
}
export interface Evaluation {
  complete: boolean;
  entries: EntryResult[];
  fuel: EntryResult;
  burn: EntryResult;
  takeOff: State;
  landing: State;
  rows: Row[];
  landingFuel: Row;
}

const isStation: Guard<Station> = objectOf({ key: isString, name: isString, armMm: isNumber, maxKg: isNumber });
const isAircraftType: Guard<AircraftType> = objectOf({
  key: isString,
  name: isString,
  mtomKg: isNumber,
  stations: arrayOf(isStation),
  envelope: arrayOf(isPair),
  fuelArmMm: isNumber,
  fuelCapacityL: isNumber,
});
const isAircraft: Guard<Aircraft> = objectOf({
  id: isString,
  emptyKg: isNumber,
  emptyArmMm: isNumber,
  weighingDate: isString,
  reportedFuelL: nullable(isNumber),
  reportedAt: nullable(isString),
});
const isFleet: Guard<Fleet> = objectOf({ type: isAircraftType, aircraft: arrayOf(isAircraft) });
const isEntry: Guard<EntryResult> = objectOf({ valid: isBoolean, empty: isBoolean, message: nullable(isString) });
const isRow: Guard<Row> = objectOf({ name: isString, litres: nullable(isNumber), kg: isNumber, armMm: isNumber, momentTenths: isNumber });
const isState: Guard<State> = objectOf({
  totalKg: isNumber,
  momentTenths: isNumber,
  cgMm: isNumber,
  cgExactMm: isNumber,
  massExceeded: isBoolean,
  massBelow: isBoolean,
  cgState: oneOf("within", "forward", "aft"),
  fwdLimitMm: isNumber,
  aftLimitMm: isNumber,
  within: isBoolean,
  indications: arrayOf(isString),
});
const isEvaluation: Guard<Evaluation> = objectOf({
  complete: isBoolean,
  entries: arrayOf(isEntry),
  fuel: isEntry,
  burn: isEntry,
  takeOff: isState,
  landing: isState,
  rows: arrayOf(isRow),
  landingFuel: isRow,
});
const isError: Guard<{ error: string }> = objectOf({ error: isString });

type Call = (ptr: number, len: number) => bigint;
interface Exports {
  memory: WebAssembly.Memory;
  alloc: (len: number) => number;
  fleet: Call;
  evaluate: Call;
}

const isFunction = (v: unknown): v is (...args: never[]) => unknown => typeof v === "function";
const isExports = (v: unknown): v is Exports =>
  typeof v === "object" &&
  v !== null &&
  "memory" in v &&
  v.memory instanceof WebAssembly.Memory &&
  "alloc" in v &&
  isFunction(v.alloc) &&
  "fleet" in v &&
  isFunction(v.fleet) &&
  "evaluate" in v &&
  isFunction(v.evaluate);

export class Core {
  private readonly x: Exports;

  private constructor(x: Exports) {
    this.x = x;
  }

  static async load(url: string): Promise<Core> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`calculation core: HTTP ${response.status}`);
    const { instance } = await WebAssembly.instantiate(await response.arrayBuffer(), {});
    return new Core(checked(instance.exports, isExports, "exports"));
  }

  private call(fn: Call, input: string): unknown {
    const data = new TextEncoder().encode(input);
    const ptr = this.x.alloc(data.length);
    new Uint8Array(this.x.memory.buffer, ptr, data.length).set(data);
    const r = fn(ptr, data.length);
    const outPtr = Number(r >> 32n);
    const outLen = Number(r & 0xffffffffn);
    const parsed: unknown = JSON.parse(new TextDecoder().decode(new Uint8Array(this.x.memory.buffer, outPtr, outLen)));
    if (isError(parsed)) throw new Error(parsed.error);
    return parsed;
  }

  fleet(typeKey: string): Fleet {
    return checked(this.call(this.x.fleet, typeKey), isFleet, "fleet data");
  }

  evaluate(typeKey: string, aircraftId: string, entries: readonly string[], fuel: string, burn: string): Evaluation {
    return checked(this.call(this.x.evaluate, [typeKey, aircraftId, ...entries, fuel, burn].join("\n")), isEvaluation, "evaluation");
  }
}
