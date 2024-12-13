import { type Writable, writable } from "svelte/store";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const secStore: Writable<{ [key: string]: { type: string; coordinates: any[]; properties: any; } }> = writable({}); // Store the polygon data


// Minimum and maximum display values
export const thresholds: Writable<[number, number]> = writable([Infinity, -Infinity]);
