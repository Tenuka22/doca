export type Roles = "admin" | "doctor" | "user" | "pending-doctor" | "guardian";

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles;
      name?: string;
      email?: string;
      phone?: string;
      image_url?: string;
    };
  }
  interface UserPublicMetadata {
    email?: string;
    image_url?: string;
    name?: string;
    phone?: string;
    role?: Roles;
  }
}
