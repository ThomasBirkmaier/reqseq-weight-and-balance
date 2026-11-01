// Display formats (decision on units and rounding): values arrive already rounded as integers.

export const kg = (v: number): string => `${v} kg`;

/** Lever arm or centre of gravity in mm (integer) as metres with three decimals. */
export const m = (mm: number): string => {
  const s = mm < 0 ? "-" : "";
  const a = Math.abs(mm);
  return `${s}${Math.floor(a / 1000)}.${String(a % 1000).padStart(3, "0")} m`;
};

/** Moment in tenths of kg·m as kg·m with one decimal. */
export const moment = (tenths: number): string => {
  const s = tenths < 0 ? "-" : "";
  const a = Math.abs(tenths);
  return `${s}${Math.floor(a / 10)}.${a % 10} kg·m`;
};
