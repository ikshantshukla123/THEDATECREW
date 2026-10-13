import { z } from "zod";

export const AddNoteSchema = z.object({
  profileId: z.string().min(1),
  type: z.enum(["CALL", "MEETING", "GENERAL"]),
  body: z.string().trim().min(1, "Write something first").max(2000),
});
