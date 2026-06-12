import { env } from "@zen-doc/env/server"

export async function getCached(key: string): Promise<string | null> {
  if (!env.CHAT_USER_CACHE_KV) return null
  try {
    return await env.CHAT_USER_CACHE_KV.get(key, "text")
  } catch {
    return null
  }
}

export async function setCached(key: string, value: string, ttl: number) {
  if (!env.CHAT_USER_CACHE_KV) return
  try {
    await env.CHAT_USER_CACHE_KV.put(key, value, { expirationTtl: ttl })
  } catch {
    // Ignore cache write errors
  }
}
