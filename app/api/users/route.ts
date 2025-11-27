import { NextResponse } from "next/server";
import { addUser, getUsers, updateUser, sanitizeUser, SanitizedUser, mergeUsers } from "@/lib/server/userStore";
import { StoredUser } from "@/lib/types";

type UsersResponse = {
  user?: SanitizedUser;
  users: SanitizedUser[];
  message?: string;
};

const buildUsersResponse = (users: StoredUser[], user?: StoredUser, message?: string) => {
  const response: UsersResponse = {
    users: users.map(sanitizeUser),
  };
  if (user) {
    response.user = sanitizeUser(user);
  }
  if (message) {
    response.message = message;
  }
  return response;
};

export async function GET() {
  const users = await getUsers();
  return NextResponse.json(buildUsersResponse(users));
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<StoredUser>;
    const username = payload.username?.trim();
    const email = payload.email?.trim().toLowerCase();
    const password = payload.password?.trim();

    if (!username || username.length < 3) {
      return NextResponse.json({ message: "Username must be at least 3 characters" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters" }, { status: 400 });
    }

    const users = await getUsers();
    const usernameTaken = users.some((u) => (u.username ?? "").toLowerCase() === username.toLowerCase());
    if (usernameTaken) {
      return NextResponse.json({ message: "This username is already taken" }, { status: 409 });
    }

    const emailTaken = users.some((u) => (u.email ?? "").toLowerCase() === email);
    if (emailTaken) {
      return NextResponse.json({ message: "An account with this email already exists" }, { status: 409 });
    }

    const newUser: StoredUser = {
      username,
      email,
      password,
      createdAt: new Date().toISOString(),
      elo: payload.elo ?? 0,
      rankedWins: payload.rankedWins ?? 0,
      rankedLosses: payload.rankedLosses ?? 0,
      profileIcon: payload.profileIcon ?? "👤",
      profileBanner: payload.profileBanner ?? "#3b82f6",
    };

    const { user, users: updatedUsers } = await addUser(newUser);
    return NextResponse.json(buildUsersResponse(updatedUsers, user, "User created"), { status: 201 });
  } catch (error) {
    console.error("Failed to create user", error);
    return NextResponse.json({ message: "Failed to create user" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = (await request.json()) as Partial<StoredUser> & { username?: string };
    const username = payload.username?.trim();
    if (!username) {
      return NextResponse.json({ message: "Username is required for updates" }, { status: 400 });
    }

    const allowedFields: Array<keyof StoredUser> = [
      "elo",
      "rankedWins",
      "rankedLosses",
      "profileIcon",
      "profileBanner",
      "email",
      "password",
    ];

    const updates: Partial<StoredUser> = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(payload, field)) {
        const value = payload[field];
        if (value !== undefined) {
          (updates as Record<string, unknown>)[field as string] = value;
        }
      }
    }

    const { user, users } = await updateUser(username, updates);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(buildUsersResponse(users, user, "User updated"));
  } catch (error) {
    console.error("Failed to update user", error);
    return NextResponse.json({ message: "Failed to update user" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const payload = await request.json().catch(() => null);
    const incoming = Array.isArray(payload?.users) ? (payload.users as StoredUser[]) : [];
    const mergedUsers = await mergeUsers(incoming);
    const message = incoming.length === 0 ? "No users provided" : "Users synced";
    return NextResponse.json(buildUsersResponse(mergedUsers, undefined, message));
  } catch (error) {
    console.error("Failed to merge users", error);
    return NextResponse.json({ message: "Failed to merge users" }, { status: 500 });
  }
}
