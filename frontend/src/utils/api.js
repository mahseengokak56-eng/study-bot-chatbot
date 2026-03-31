// utils/api.js — Frontend ↔ Backend bridge

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Stream a chat message using Server-Sent Events.
 * Calls onToken(token) for each chunk, onDone() when complete, onError(err) on failure.
 *
 * @param {string} message
 * @param {string} sessionId
 * @param {function} onToken  - called with each text chunk
 * @param {function} onDone   - called when stream ends
 * @param {function} onError  - called with error message
 */
export const streamChatMessage = async (message, sessionId, onToken, onDone, onError) => {
  try {
    const response = await fetch(`${BASE_URL}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, session_id: sessionId }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Server error ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      const lines = text.split("\n");

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const data = JSON.parse(line.slice(6));
          if (data.token) onToken(data.token);
          if (data.done) { onDone(); return; }
          if (data.error) throw new Error(data.error);
        } catch (parseErr) {
          // Ignore partial SSE chunks
        }
      }
    }
    onDone();
  } catch (err) {
    onError(err.message || "Connection failed. Is the backend running?");
  }
};

/**
 * Fetch the full chat history for a session from MongoDB.
 */
export const fetchSessionHistory = async (sessionId) => {
  const response = await fetch(`${BASE_URL}/history/${sessionId}`);
  if (!response.ok) throw new Error("Failed to fetch history");
  const data = await response.json();
  return data.messages;
};

/**
 * Fetch all sessions from the backend.
 */
export const fetchAllSessions = async () => {
  const response = await fetch(`${BASE_URL}/sessions`);
  if (!response.ok) throw new Error("Failed to fetch sessions");
  const data = await response.json();
  return data.sessions;
};

/**
 * Delete a session and all its messages.
 */
export const deleteSession = async (sessionId) => {
  const response = await fetch(`${BASE_URL}/history/${sessionId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete session");
  return response.json();
};
