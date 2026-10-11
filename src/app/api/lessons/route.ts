import { getDb } from "@/lib/server/db";
import { requireUser } from "@/lib/server/http";
import { listLessons } from "@/lib/server/lessons";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  return Response.json({ lessons: await listLessons(await getDb(), auth.user.id) });
}
