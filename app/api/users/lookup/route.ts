import { NextResponse } from "next/server";
import { getUsers, sanitizeUser } from "@/lib/server/userStore";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const emailRaw = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    if (!emailRaw) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    const users = await getUsers();
    const user = users.find((candidate) => (candidate.email ?? "").toLowerCase() === emailRaw);
    if (!user) {
      return NextResponse.json({ message: "No account found with this email address" }, { status: 404 });
    }

    return NextResponse.json({
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error("Lookup failed", error);
    return NextResponse.json({ message: "Failed to lookup user" }, { status: 500 });
  }
}
