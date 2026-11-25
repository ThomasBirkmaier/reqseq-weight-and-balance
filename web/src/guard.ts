// Run-time checks of the JSON that the calculation core returns. A slow network can mix a fresh
// and a cached build (see sw.js); a value of an unexpected shape is an error, never a result.

/** A check that narrows an unknown value to T. */
export type Guard<T> = (v: unknown) => v is T;

/** A string. */
export const isString: Guard<string> = (v): v is string => typeof v === "string";
/** A finite number. */
export const isNumber: Guard<number> = (v): v is number => typeof v === "number" && Number.isFinite(v);
/** true or false. */
export const isBoolean: Guard<boolean> = (v): v is boolean => typeof v === "boolean";

/** null or a value of the guarded type. */
export const nullable =
  <T>(g: Guard<T>): Guard<T | null> =>
  (v): v is T | null =>
    v === null || g(v);

/** An array whose every element is of the guarded type. */
export const arrayOf =
  <T>(g: Guard<T>): Guard<T[]> =>
  (v): v is T[] =>
    Array.isArray(v) && v.every((x) => g(x));

/** A pair of numbers. */
export const isPair: Guard<[number, number]> = (v): v is [number, number] =>
  Array.isArray(v) && v.length === 2 && v.every((x) => isNumber(x));

/** One of the given strings. */
export const oneOf =
  <const T extends readonly string[]>(...values: T): Guard<T[number]> =>
  (v): v is T[number] =>
    typeof v === "string" && values.includes(v);

/** The type that a guard checks. */
export type Guarded<G> = G extends Guard<infer T> ? T : never;

/** An object with at least the guarded fields. */
export const objectOf =
  <F extends Record<string, Guard<unknown>>>(fields: F): Guard<{ [K in keyof F]: Guarded<F[K]> }> =>
  (v): v is { [K in keyof F]: Guarded<F[K]> } => {
    if (typeof v !== "object" || v === null) return false;
    const o: Partial<Record<string, unknown>> = { ...v };
    return Object.entries(fields).every(([k, g]) => g(o[k]));
  };

/** The value, if it passes the guard; otherwise an error naming what was expected. */
export function checked<T>(v: unknown, g: Guard<T>, what: string): T {
  if (!g(v)) throw new TypeError(`unexpected ${what} from the calculation core`);
  return v;
}
