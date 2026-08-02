import { request } from "./backendClient";

export async function listContributions(params = {}) {
  return await request("GET", "/api/contributions", undefined, params);
}

export async function createContribution(data) {
  return await request("POST", "/api/contributions", data);
}

export async function updateContribution(id, data) {
  return await request("PUT", `/api/contributions/${id}`, data);
}
