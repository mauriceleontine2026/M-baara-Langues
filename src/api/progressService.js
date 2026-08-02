import { request } from "./backendClient";

export async function getProgress() {
  return await request("GET", "/api/progress");
}

export async function updateProgress(payload) {
  return await request("POST", "/api/progress", payload);
}
