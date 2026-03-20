import { getSession } from "@/lib/auth-jwt";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: { seller: true },
  });

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireSeller() {
  const user = await requireUser();
  if (user.role !== "SELLER" || !user.seller) {
    throw new Error("Not a seller");
  }
  return { user, seller: user.seller };
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new Error("Not an admin");
  }
  return user;
}
