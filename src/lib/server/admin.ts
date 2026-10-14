import "server-only";

/**
 * Site operators, who can see operational pages such as the generation log: the comma-separated emails in
 * `ADMIN_EMAILS`. While developing with no list set, every signed-in user counts, so the log works locally
 * without setup; production with no list has no operators.
 */
export function isOperator(email: string, env: NodeJS.ProcessEnv = process.env): boolean {
  const list = (env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (list.length === 0) return env.NODE_ENV !== "production";
  return list.includes(email.toLowerCase());
}
