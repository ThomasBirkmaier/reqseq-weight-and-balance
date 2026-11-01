// Loader of the WebAssembly calculation core and its JSON interface.

export interface Station { key: string; name: string; armMm: number; maxKg: number }
export interface AircraftType { key: string; name: string; mtomKg: number; stations: Station[]; envelope: [number, number][] }
export interface Aircraft { id: string; emptyKg: number; emptyArmMm: number; weighingDate: string }
export interface Fleet { type: AircraftType; aircraft: Aircraft[] }
export interface EntryResult { valid: boolean; empty: boolean; message: string | null }
export interface Row { name: string; kg: number; armMm: number; momentTenths: number }
export interface Evaluation {
  complete: boolean;
  entries: EntryResult[];
  totalKg: number;
  momentTenths: number;
  cgMm: number;
  cgExactMm: number;
  massExceeded: boolean;
  cgState: "within" | "forward" | "aft";
  fwdLimitMm: number;
  aftLimitMm: number;
  within: boolean;
  indications: string[];
  rows: Row[];
}

interface Exports {
  memory: WebAssembly.Memory;
  alloc(len: number): number;
  fleet(ptr: number, len: number): bigint;
  evaluate(ptr: number, len: number): bigint;
}

export class Core {
  private constructor(private x: Exports) {}

  static async load(url: string): Promise<Core> {
    const bytes = await (await fetch(url)).arrayBuffer();
    const { instance } = await WebAssembly.instantiate(bytes, {});
    return new Core(instance.exports as unknown as Exports);
  }

  private call(fn: (p: number, l: number) => bigint, input: string): string {
    const data = new TextEncoder().encode(input);
    const ptr = this.x.alloc(data.length);
    new Uint8Array(this.x.memory.buffer, ptr, data.length).set(data);
    const r = fn(ptr, data.length);
    const outPtr = Number(r >> 32n);
    const outLen = Number(r & 0xffffffffn);
    return new TextDecoder().decode(new Uint8Array(this.x.memory.buffer, outPtr, outLen));
  }

  fleet(typeKey: string): Fleet {
    const f = JSON.parse(this.call(this.x.fleet, typeKey));
    if (f.error) throw new Error(f.error);
    return f;
  }

  evaluate(typeKey: string, aircraftId: string, entries: string[]): Evaluation {
    return JSON.parse(this.call(this.x.evaluate, [typeKey, aircraftId, ...entries].join("\n")));
  }
}
