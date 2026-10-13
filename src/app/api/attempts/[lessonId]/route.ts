import { quizAttemptSchema } from "@/lib/quiz/attempt";
import { getDb } from "@/lib/server/db";
import { jsonError, readJson, requestT, requireUser } from "@/lib/server/http";
import { deleteAttempt, getAttempt, saveAttempt } from "@/lib/server/lessons";

export async function GET(request: Request, ctx: RouteContext<"/api/attempts/[lessonId]">) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  const { lessonId } = await ctx.params;
  return Response.json({ attempt: (await getAttempt(await getDb(), auth.user.id, lessonId)) ?? null });
}

export async function PUT(request: Request, ctx: RouteContext<"/api/attempts/[lessonId]">) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  const { lessonId } = await ctx.params;
  const read = await readJson(request, 16_000);
  if ("error" in read) return read.error;

  const parsed = quizAttemptSchema.safeParse(read.body);
  if (!parsed.success || parsed.data.lessonId !== lessonId) return jsonError(422, requestT(request).server.attemptInvalid);
  await saveAttempt(await getDb(), auth.user.id, parsed.data);
  return new Response(null, { status: 204 });
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/attempts/[lessonId]">) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  const { lessonId } = await ctx.params;
  await deleteAttempt(await getDb(), auth.user.id, lessonId);
  return new Response(null, { status: 204 });
}
