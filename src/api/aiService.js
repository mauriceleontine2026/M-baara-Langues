import { request } from "./backendClient";

export async function invokeAI(prompt, responseJsonSchema = null, temperature = 0.7) {
  return await request("POST", "/api/ai/chat", {
    prompt,
    response_json_schema: responseJsonSchema,
    temperature,
  });
}
