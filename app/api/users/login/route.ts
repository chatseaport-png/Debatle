import { NextResponse } from "next/server";
import { getUsers, sanitizeUser } from "@/lib/server/userStore";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const identifier = typeof payload.identifier === "string" ? payload.identifier.trim() : "";
    const password = typeof payload.password === "string" ? payload.password.trim() : "";

    if (!identifier || !password) {
      return NextResponse.json({ message: "Identifier and password are required" }, { status: 400 });
    }

    const normalizedIdentifier = identifier.toLowerCase();
    const users = await getUsers();
    const user = users.find((candidate) => {
      const username = candidate.username?.toLowerCase();
      const email = candidate.email?.toLowerCase();
      return username === normalizedIdentifier || email === normalizedIdentifier;
    });

    if (!user || user.password !== password) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    return NextResponse.json({
      user: sanitizeUser(user),
      users: users.map(sanitizeUser)
    });
  } catch (error) {
    console.error("Login failed", error);
    return NextResponse.json({ message: "Failed to login" }, { status: 500 });
  }
}
