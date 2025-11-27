import { promises as fs } from "fs";
import path from "path";
import { StoredUser } from "@/lib/types";

export type SanitizedUser = Omit<StoredUser, "password">;

const DATA_FILE = path.join(process.cwd(), "data", "users.json");

const defaultUserShape = (user: StoredUser): StoredUser => ({
  username: user.username,
  email: user.email,
  password: user.password,
  elo: user.elo ?? 0,
  rankedWins: user.rankedWins ?? 0,
  rankedLosses: user.rankedLosses ?? 0,
  profileIcon: user.profileIcon ?? "👤",
  profileBanner: user.profileBanner ?? "#3b82f6",
  createdAt: user.createdAt ?? new Date().toISOString(),
});

export const sanitizeUser = (user: StoredUser): SanitizedUser => {
  const clone = { ...user } as Record<string, unknown>;
  delete clone.password;
  return clone as SanitizedUser;
};

async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

export async function getUsers(): Promise<StoredUser[]> {
  await ensureDataFile();
  try {
    const fileContents = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(fileContents) as StoredUser[];
    if (Array.isArray(parsed)) {
      return parsed.map(defaultUserShape);
    }
  } catch (error) {
    console.error("Failed to read users file", error);
  }
  return [];
}

export async function saveUsers(users: StoredUser[]): Promise<void> {
  await ensureDataFile();
  const normalized = users.map(defaultUserShape);
  await fs.writeFile(DATA_FILE, JSON.stringify(normalized, null, 2), "utf-8");
}

export async function addUser(user: StoredUser): Promise<{ user: StoredUser; users: StoredUser[] }> {
  const users = await getUsers();
  const normalized = defaultUserShape(user);
  users.push(normalized);
  await saveUsers(users);
  return { user: normalized, users };
}

export async function updateUser(username: string, updates: Partial<StoredUser>): Promise<{ user: StoredUser | null; users: StoredUser[] }> {
  const users = await getUsers();
  const index = users.findIndex((existing) => existing.username.toLowerCase() === username.toLowerCase());
  if (index === -1) {
    return { user: null, users };
  }
  const merged: StoredUser = defaultUserShape({
    ...users[index],
    ...updates,
    username: users[index].username,
  });
  users[index] = merged;
  await saveUsers(users);
  return { user: merged, users };
}
