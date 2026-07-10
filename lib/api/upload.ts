import { api } from "./client";

export async function uploadImage(folder: string, file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const data = await api.postForm<{ url: string }>(`/api/v1/upload/${folder}`, form);
  return data.url;
}
