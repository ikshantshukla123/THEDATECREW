import type { Factor } from "../types";

export const locationFactor: Factor = (client, candidate) => {
  if (client.city === candidate.city) {
    return { score: 1, reason: `Both in ${client.city}` };
  }
  if (client.state && client.state === candidate.state) {
    return { score: 0.7, reason: `Both in ${client.state}` };
  }
  return { score: 0.3, reason: `${candidate.city} and ${client.city}` };
};
