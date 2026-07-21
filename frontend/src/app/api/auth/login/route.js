import { NextResponse } from "next/server";
import {
  buildSessionPayload,
  clearSession,
  readSession,
  toPublicUser,
  writeSession,
} from "@/lib/auth/session";
import { AUTH_ROLES } from "@/constants/auth";

/**
 * POST /api/auth/login
 * Sets an httpOnly session cookie. Ready to swap body validation for a real auth API.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim();
    const role =
      body?.role === AUTH_ROLES.FACULTY
        ? AUTH_ROLES.FACULTY
        : AUTH_ROLES.STUDENT;
    const name = String(body?.name || "").trim();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    // Simulated auth — replace with credential verification against your backend.
    const session = buildSessionPayload({
      role,
      email,
      name:
        name ||
        (role === AUTH_ROLES.FACULTY
          ? "Faculty Operator"
          : "Marcus Vance Jr."),
    });

    await writeSession(session);

    return NextResponse.json({
      user: toPublicUser(session),
      authenticated: true,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Unable to establish session." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/login — logout alias
 */
export async function DELETE() {
  await clearSession();
  return NextResponse.json({ authenticated: false });
}
