import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/server/auth";

export const { GET, POST, PATCH, PUT, DELETE } = toNextJsHandler(async (request: Request) =>
  (await getAuth()).handler(request),
);
