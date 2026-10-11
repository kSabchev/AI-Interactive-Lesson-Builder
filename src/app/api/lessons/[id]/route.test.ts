import { describe, expect, it, vi } from "vitest";
import { getSampleLesson } from "@/content/samples";

let sessionUser: { id: string; email: string; name: string } | null = null;
vi.mock("@/lib/server/auth", () => ({ getSessionUser: async () => sessionUser }));

const { PUT } = await import("./route");
const { getDb } = await import("@/lib/server/db");
const { billingAccount, user } = await import("@/lib/server/db/schema");

const sample = getSampleLesson("sample-water-cycle")!;

async function signInAs(id: string, plan: "free" | "pro") {
  const db = await getDb();
  await db.insert(user).values({ id, name: id, email: `${id}@example.com` });
  if (plan === "pro") {
    await db.insert(billingAccount).values({ userId: id, stripeCustomerId: `cus_${id}`, plan: "pro", status: "active" });
  }
  sessionUser = { id, email: `${id}@example.com`, name: id };
}

function save(id: string, title = `Lesson ${id}`) {
  const lesson = { ...sample, id, title };
  return PUT(
    new Request(`http://localhost/api/lessons/${id}`, {
      method: "PUT",
      headers: { "content-type": "application/json", host: "localhost", origin: "http://localhost" },
      body: JSON.stringify(lesson),
    }),
    { params: Promise.resolve({ id }) },
  );
}

describe("saved-lesson limit", () => {
  it("stops a Free account adding an 11th lesson but keeps existing ones editable", async () => {
    await signInAs("cap-free", "free");
    for (let i = 0; i < 10; i++) expect((await save(`free-${i}`)).status).toBe(200);

    const eleventh = await save("free-10");
    expect(eleventh.status).toBe(403);
    expect((await eleventh.json()).error).toMatchObject({ code: "lesson_limit" });

    expect((await save("free-3", "Renamed")).status).toBe(200);
  });

  it("doesn't limit Pro accounts", async () => {
    await signInAs("cap-pro", "pro");
    for (let i = 0; i < 12; i++) expect((await save(`pro-${i}`)).status).toBe(200);
  });
});
