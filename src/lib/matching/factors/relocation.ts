import type { Factor } from "../types";

export const relocationFactor: Factor = (client, candidate) => {
  if (client.city === candidate.city) {
    return { score: 1, reason: `Both in ${client.city}` };
  }
  if (candidate.openToRelocate === "YES") {
    return { score: 1, reason: `Open to relocating to ${client.city}` };
  }
  if (client.openToRelocate === "YES") {
    return { score: 0.9, reason: `Client is open to moving to ${candidate.city}` };
  }
  if (candidate.openToRelocate === "MAYBE" || client.openToRelocate === "MAYBE") {
    return { score: 0.55, reason: "One side is open to relocating" };
  }
  return { score: 0.15, reason: `Neither will move from ${candidate.city} or ${client.city}` };
};
