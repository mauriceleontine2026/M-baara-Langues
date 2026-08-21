import { request } from "./backendClient";

export async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  return await request("POST", "/api/audio/upload", formData);
}

export async function uploadProfilePhoto(file) {
  const formData = new FormData();
  formData.append("file", file);
  return await request("POST", "/api/auth/me/photo", formData);
}
