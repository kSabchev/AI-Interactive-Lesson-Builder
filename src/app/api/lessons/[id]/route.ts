import { lessonSchema } from "@/lib/lesson/schema";
import { getEntitlements } from "@/lib/server/billing/account";
import { getDb } from "@/lib/server/db";
import { jsonError, readJson, requireUser } from "@/lib/server/http";
import { deleteLesson, getLesson, saveLesson } from "@/lib/server/lessons";

/** A full lesson is well under this; the cap stops oversized payloads before parsing. */
const MAX_LESSON_BYTES = 256_000;

export async function GET(request: Request, ctx: RouteContext<"/api/lessons/[id]">) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  const { id } = await ctx.params;
  const lesson = await getLesson(await getDb(), auth.user.id, id);
  return lesson ? Response.json({ lesson }) : jsonError(404, "Lesson not found.");
}

export async function PUT(request: Request, ctx: RouteContext<"/api/lessons/[id]">) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  const { id } = await ctx.params;
  const read = await readJson(request, MAX_LESSON_BYTES);
  if ("error" in read) return read.error;

  const parsed = lessonSchema.safeParse(read.body);
  if (!parsed.success) return jsonError(422, "That lesson isn't valid.");
  if (parsed.data.id !== id) return jsonError(400, "The lesson id doesn't match the address.");

  const db = await getDb();
  // Plans can cap how many lessons an account keeps. Existing lessons always stay editable.
  if (!(await getLesson(db, auth.user.id, id))) {
    const { plan, savedLessons } = await getEntitlements(db, auth.user.id);
    if (plan.savedLessons !== null && savedLessons >= plan.savedLessons) {
      return jsonError(
        403,
        `The ${plan.name} plan keeps up to ${plan.savedLessons} lessons. Delete one or upgrade to save more.`,
        "lesson_limit",
      );
    }
  }

  const lesson = await saveLesson(db, auth.user.id, parsed.data);
  return Response.json({ lesson });
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/lessons/[id]">) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  const { id } = await ctx.params;
  await deleteLesson(await getDb(), auth.user.id, id);
  return new Response(null, { status: 204 });
}
