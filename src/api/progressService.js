import { request } from "./backendClient";

export async function getProgress() {
  try {
    return await request("GET", "/api/progress");
  } catch (err) {
    // If backend returns validation error (422) while unauthenticated or
    // missing body, treat as no progress available.
    if (err && err.status === 422) {
      return [];
    }
    // If not authenticated, return empty so UI can render a logged-out state.
    if (err && err.status === 401) {
      return [];
    }
    throw err;
  }
}

export async function updateProgress(payload) {
  try {
    const result = await request("POST", "/api/progress", payload);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("mbaara-progress-updated"));
    }
    return result;
  } catch (err) {
    // Return structured error so callers can react (e.g., show login prompt).
    if (err && err.status === 401) {
      return { error: "unauthenticated", status: 401 };
    }
    if (err && err.status === 422) {
      return { error: "invalid_request", status: 422, data: err.data };
    }
    throw err;
  }
}
