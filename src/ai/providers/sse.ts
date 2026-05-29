/**
 * Parse a Server-Sent Events (text/event-stream) ReadableStream.
 * Yields one { event, data } object per `data:` line.
 * The `event` field reflects the most recent `event:` directive in the block.
 */
export async function* parseSSE(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<{ event: string | undefined; data: string }> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent: string | undefined;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const raw of lines) {
        const line = raw.endsWith("\r") ? raw.slice(0, -1) : raw;

        if (line === "") {
          currentEvent = undefined;
        } else if (line.startsWith("event:")) {
          currentEvent = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          yield { event: currentEvent, data: line.slice(5).trim() };
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
