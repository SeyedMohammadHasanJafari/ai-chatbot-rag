import { auth } from "@/auth";

export interface AuthenticatedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string;
  isDemo?: boolean;
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return session.user as AuthenticatedUser;
}

export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
