import { NextResponse } from "next/server";
import { readSession, toPublicUser } from "@/lib/auth/session";

/**
 * GET /api/auth/me
 * Returns the public user derived from the httpOnly session cookie.
 */
export async function GET() {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({
      authenticated: false,
      user: null,
    });
  }

  return NextResponse.json({
    authenticated: true,
    user: toPublicUser(session),
  });
}
