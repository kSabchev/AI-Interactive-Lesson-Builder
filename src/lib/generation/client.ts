import type { GenerationEvent } from "./events";
import type { GenerationInput } from "./input";

/**
 * Posts a generation request and calls `onEvent` for each newline-delimited JSON event.
 * Errors the server rejects before streaming (bad input, rate limits) arrive as a single error event too.
 */
export async function requestGeneration(
  input: GenerationInput,
  onEvent: (event: GenerationEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/lessons/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    onEvent({ type: "error", code: "unavailable", message: "Couldn't reach the server. Check your connection and try again." });
    return;
  }

  if (!response.ok || !response.body) {
    const body = (await response.json().catch(() => null)) as { error?: { code?: string; message?: string } } | null;
    onEvent({
      type: "error",
      code: (body?.error?.code as Extract<GenerationEvent, { type: "error" }>["code"]) ?? "unavailable",
      message: body?.error?.message ?? "Generation failed. Please try again.",
    });
    return;
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  let finished = false;
  for (;;) {
    const { value, done } = await reader.read();
    if (value) buffer += value;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line) as GenerationEvent;
      if (event.type === "done" || event.type === "error") finished = true;
      onEvent(event);
    }
    if (done) break;
  }
  if (!finished) {
    onEvent({ type: "error", code: "unavailable", message: "The connection closed before the lesson was ready. Please try again." });
  }
}
