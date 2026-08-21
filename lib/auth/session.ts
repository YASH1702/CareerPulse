import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function getRequiredSession() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }
  return session;
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function getRequiredUserId(): Promise<string> {
  const session = await getRequiredSession();
  // session.user is guaranteed by getRequiredSession's redirect guard
  return (session.user as { id: string }).id;
}
