import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * API Route에서 인증된 세션을 요구하는 헬퍼
 *
 * 인증되지 않은 경우 null을 반환한다.
 * 호출부에서 null 체크 후 401 응답을 반환하면 된다.
 *
 * @example
 * ```ts
 * export async function POST(req: Request) {
 *   const session = await requireAuth();
 *   if (!session) {
 *     return Response.json(
 *       { success: false, error: "Unauthorized" },
 *       { status: 401 }
 *     );
 *   }
 *   // session.user.id 사용 가능
 * }
 * ```
 */
export const requireAuth = async () => {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session;
};

/**
 * 현재 로그인한 사용자의 DB 레코드를 조회한다.
 *
 * 세션에 포함되지 않은 상세 정보(createdAt 등)가 필요할 때 사용.
 * 인증되지 않은 경우 null을 반환한다.
 */
export const getCurrentUser = async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      nickname: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};
