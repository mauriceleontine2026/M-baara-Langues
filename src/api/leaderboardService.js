import { request } from "./backendClient";

export async function getLeaderboard() {
  return await request("GET", "/api/leaderboard");
}
