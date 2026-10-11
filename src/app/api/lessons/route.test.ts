import { describe, expect, it } from "vitest";
import { getSampleLesson } from "@/content/samples";
import { GET as listLessons } from "./route";
import { DELETE, PUT } from "./[id]/route";

const lesson = getSampleLesson("sample-water-cycle")!;
const ctx = { params: Promise.resolve({ id: lesson.id }) };

function request(method: string, headers: Record<string, string> = {}, body?: unknown) {
  return new Request(`http://localhost:3000/api/lessons/${lesson.id}`, {
    method,
    headers: { host: "localhost:3000", "content-type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("lesson API access control", () => {
  it("requires a signed-in user", async () => {
    const response = await listLessons(request("GET"));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: { message: "Sign in to continue." } });
  });

  it("rejects cross-site writes before checking the session", async () => {
    const put = await PUT(request("PUT", { origin: "https://evil.example" }, lesson), ctx);
    expect(put.status).toBe(403);
    const del = await DELETE(request("DELETE", { origin: "https://evil.example" }), ctx);
    expect(del.status).toBe(403);
  });

  it("allows same-origin writes through to the session check", async () => {
    const response = await PUT(request("PUT", { origin: "http://localhost:3000" }, lesson), ctx);
    expect(response.status).toBe(401);
  });
});
