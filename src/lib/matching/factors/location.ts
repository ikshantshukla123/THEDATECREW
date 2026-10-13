import type { Factor } from "../types";

/**
 * A stated city list is the target when there is one — a Chennai client who
 * asks for Chennai should not be rewarded for a Coimbatore candidate just
 * because they share a state. With no list, proximity to the client's own
 * city is the next best proxy.
 */
export const locationFactor: Factor = (client, candidate, ctx) => {
  const wanted = ctx.preference?.cities ?? [];

  if (wanted.length > 0) {
    if (wanted.includes(candidate.city)) {
      return { score: 1, reason: `In ${candidate.city}, a city they asked for` };
    }
    if (candidate.openToRelocate === "YES") {
      return { score: 0.6, reason: `In ${candidate.city} but open to moving` };
    }
    if (candidate.openToRelocate === "MAYBE") {
      return { score: 0.45, reason: `In ${candidate.city}, might consider moving` };
    }
    return { score: 0.15, reason: `Settled in ${candidate.city}, not on their list` };
  }

  if (client.city === candidate.city) {
    return { score: 1, reason: `Both in ${client.city}` };
  }
  if (client.state && client.state === candidate.state) {
    return { score: 0.7, reason: `Both in ${client.state}` };
  }
  return { score: 0.3, reason: `${candidate.city} and ${client.city}` };
};
