import { lessonSchema } from "@/lib/lesson/schema";
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

  const lesson = await saveLesson(await getDb(), auth.user.id, parsed.data);
  return Response.json({ lesson });
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/lessons/[id]">) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  const { id } = await ctx.params;
  await deleteLesson(await getDb(), auth.user.id, id);
  return new Response(null, { status: 204 });
}
