export interface SSEHandlers {
  onSession?: (data: { session_id: string }) => void;
  onToken: (text: string) => void;
  onDone: (data: { finish_reason: string }) => void;
  onError: (err: Error) => void;
}

interface StreamChatOptions {
  message: string;
  sessionId: string | null;
  getToken: () => Promise<string | null>;
  signal: AbortSignal;
  handlers: SSEHandlers;
}

function toError(e: unknown): Error {
  return e instanceof Error ? e : new Error(String(e));
}

export async function streamChat(opts: StreamChatOptions): Promise<void> {
  const { message, sessionId, getToken, signal, handlers } = opts;
  const token = await getToken();
  if (!token) {
    handlers.onError(new Error("Not authenticated"));
    return;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    handlers.onError(new Error("NEXT_PUBLIC_API_URL is not set"));
    return;
  }

  let res: Response;
  try {
    res = await fetch(`${apiUrl}/api/chat/stream`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ session_id: sessionId, message }),
      signal,
    });
  } catch (e: unknown) {
    handlers.onError(toError(e));
    return;
  }

  if (!res.ok || !res.body) {
    handlers.onError(new Error(`Stream failed: ${res.status}`));
    return;
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  let currentEvent = "message";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (line.startsWith("event:")) {
          currentEvent = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          const payload = line.slice(5).trim();
          try {
            const json = JSON.parse(payload) as Record<string, unknown>;
            if (currentEvent === "session") {
              handlers.onSession?.(json as { session_id: string });
            } else if (currentEvent === "token") {
              handlers.onToken(String(json.text ?? ""));
            } else if (currentEvent === "done") {
              handlers.onDone(json as { finish_reason: string });
            } else if (currentEvent === "error") {
              handlers.onError(
                new Error(String(json.message ?? "Stream error")),
              );
            }
          } catch {
            // Ignore malformed payloads.
          }
        } else if (line === "") {
          currentEvent = "message";
        }
      }
    }
  } catch (e: unknown) {
    const err = toError(e);
    if (err.name !== "AbortError") handlers.onError(err);
  }
}
