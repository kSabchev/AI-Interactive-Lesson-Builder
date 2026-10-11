import { z } from "zod";
import { quizAttemptSchema } from "@/lib/quiz/attempt";
import { getEntitlements } from "@/lib/server/billing/account";
import { getDb } from "@/lib/server/db";
import { jsonError, readJson, requireUser } from "@/lib/server/http";
import { importGuestData } from "@/lib/server/lessons";

const importSchema = z.object({
  // Each lesson is validated individually so one bad record doesn't block the rest.
  lessons: z.array(z.unknown()).max(200),
  attempts: z.array(quizAttemptSchema).max(400),
});

/** Copies lessons and attempts a guest saved in this browser into their account. */
export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  const read = await readJson(request, 5_000_000);
  if ("error" in read) return read.error;

  const parsed = importSchema.safeParse(read.body);
  if (!parsed.success) return jsonError(422, "The import data isn't valid.");
  const db = await getDb();
  const { plan, savedLessons } = await getEntitlements(db, auth.user.id);
  const allowance = plan.savedLessons === null ? undefined : Math.max(plan.savedLessons - savedLessons, 0);
  return Response.json(await importGuestData(db, auth.user.id, parsed.data, allowance));
}
