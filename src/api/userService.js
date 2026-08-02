import { request } from "./backendClient";

export async function listUsers() {
  return await request("GET", "/api/users");
}

export async function inviteUser(email) {
  return await request("POST", "/api/users/invite", { email });
}
