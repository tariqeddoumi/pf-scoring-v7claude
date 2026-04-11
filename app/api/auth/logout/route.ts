import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 });

  // Supprimer le cookie
  response.cookies.set("auth_token", "", {
    httpOnly: false,
    maxAge: 0,
    path: "/",
  });

  return response;
}
