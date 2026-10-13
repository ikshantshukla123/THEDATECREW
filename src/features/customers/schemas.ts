import { z } from "zod";

const STATUSES = [
  "NEW", "VERIFIED", "SHORTLISTING", "MATCH_SENT",
  "MEETING_SCHEDULED", "ON_HOLD", "MATCHED", "CLOSED",
] as const;

export const UpdateStatusSchema = z.object({
  profileId: z.string().min(1),
  status: z.enum(STATUSES),
});

export const RevealContactSchema = z.object({
  profileId: z.string().min(1),
});
