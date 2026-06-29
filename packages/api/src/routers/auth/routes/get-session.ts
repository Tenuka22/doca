import { publicProcedure } from "../../../index";

export interface UserAccount {
  email?: string;
  id: string;
  image_url?: string;
  name?: string;
  phone?: string;
  role: string;
}

export const getSessionRoute = publicProcedure.handler(
  async ({ context }): Promise<UserAccount | null> => {
    if (!context.auth?.user) {
      return null;
    }

    const user = context.auth.user;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image_url: user.image ?? undefined,
      role: user.role ?? "user",
    } satisfies UserAccount;
  }
);
