export function getSignUpUrl(): string {
  if (import.meta.env.VITE_WEB_URL) {
    return new URL("/sign-up", import.meta.env.VITE_WEB_URL).toString();
  }

  if (import.meta.env.DEV) {
    return "http://localhost:3001/sign-up";
  }

  return "/sign-up";
}

export const SIGN_UP_URL = getSignUpUrl();
