// Loader of the WebAssembly calculation core and its JSON interface.
import {
  arrayOf,
  checked,
  isBoolean,
  isNumber,
  isPair,
  isString,
  nullable,
  objectOf,
  oneOf,
  type Guard,
} from "./guard.js";

/** A loading station of the aircraft type. */
export interface Station {
  /** Key of the station, used in the entry ids (`entry-<key>`). */
  key: string;
  /** Name shown to the pilot. */
  name: string;
  /** Lever arm in mm aft of the datum. */
  armMm: number;
  /** Maximum mass of the station in kg. */
  maxKg: number;
}
/** The type data of the build's aircraft type. */
export interface AircraftType {
  /** Type key of the build (hc4, hc2). */
  key: string;
  /** Type name shown to the pilot. */
  name: string;
  /** Maximum take-off mass in kg. */
  mtomKg: number;
  /** The loading stations, in the order of the entries. */
  stations: Station[];
  /** Envelope corners as [total mass kg, centre of gravity mm], in order. */
  envelope: [number, number][];
  /** Fuel lever arm in mm aft of the datum (from the fuel interface data file). */
  fuelArmMm: number;
  /** Usable fuel capacity in whole litres. */
  fuelCapacityL: number;
}
/** One aircraft of the build's fleet. */
export interface Aircraft {
  /** Invented identifier (not a registration). */
  id: string;
  /** Empty mass in kg. */
  emptyKg: number;
  /** Lever arm of the empty mass in mm. */
  emptyArmMm: number;
  /** Date of the last weighing (YYYY-MM-DD). */
  weighingDate: string;
  /** Usable fuel last reported by the fuel system module in litres, or null without a report. */
  reportedFuelL: number | null;
  /** Report time in UTC (ISO 8601), or null without a report. */
  reportedAt: string | null;
}
/** The fleet of the build with its aircraft type. */
export interface Fleet {
  /** The aircraft type of the build. */
  type: AircraftType;
  /** The aircraft of that type. */
  aircraft: Aircraft[];
  /** Date of the aircraft data: the newest date of the fleet and fuel data files. */
}
/** The check of one entry. */
export interface EntryResult {
  /** True when the entry holds a permitted value. */
  valid: boolean;
  /** True when the entry is empty. */
  empty: boolean;
  /** Message next to an invalid entry, or null. */
  message: string | null;
}
/** One row of the calculation table (values already rounded by the core). */
export interface Row {
  /** Name of the row. */
  name: string;
  /** Litres for a fuel row, null for the others. */
  litres: number | null;
  /** Mass in kg. */
  kg: number;
  /** Lever arm in mm. */
  armMm: number;
  /** Moment in tenths of kg·m. */
  momentTenths: number;
}
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
/** The evaluation of one loading at take-off and at landing. */
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
const isRow: Guard<Row> = objectOf({
  name: isString,
  litres: nullable(isNumber),
  kg: isNumber,
  armMm: isNumber,
  momentTenths: isNumber,
});
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

/** The WebAssembly calculation core and its JSON interface. */
export class Core {
  private readonly x: Exports;

  private constructor(x: Exports) {
    this.x = x;
  }

  /** Loads and instantiates the core from `url`. */
  static async load(url: string): Promise<Core> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`calculation core: HTTP ${response.status}`);
    const { instance } = await WebAssembly.instantiate(await response.arrayBuffer(), {});
    return new Core(checked(instance.exports, isExports, "exports"));
  }

  /** Calls an export with `input` as UTF-8 and returns the parsed JSON result (an error result throws). */
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

  /** The fleet of the build for the type key. */
  fleet(typeKey: string): Fleet {
    return checked(this.call(this.x.fleet, typeKey), isFleet, "fleet data");
  }

  /** Evaluates one loading of the aircraft: one text per station, the usable fuel and the planned burn. */
  evaluate(typeKey: string, aircraftId: string, entries: readonly string[], fuel: string, burn: string): Evaluation {
    return checked(
      this.call(this.x.evaluate, [typeKey, aircraftId, ...entries, fuel, burn].join("\n")),
      isEvaluation,
      "evaluation",
    );
  }
}
