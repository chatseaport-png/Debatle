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

const mergeUserRecord = (existing: StoredUser | undefined, incoming: StoredUser): StoredUser => {
  if (!existing) {
    return defaultUserShape(incoming);
  }

  const merged: StoredUser = defaultUserShape({
    username: existing.username ?? incoming.username,
    email: incoming.email ?? existing.email,
    password: incoming.password ?? existing.password,
    elo: incoming.elo ?? existing.elo,
    rankedWins: incoming.rankedWins ?? existing.rankedWins,
    rankedLosses: incoming.rankedLosses ?? existing.rankedLosses,
    profileIcon: incoming.profileIcon ?? existing.profileIcon,
    profileBanner: incoming.profileBanner ?? existing.profileBanner,
    createdAt: existing.createdAt ?? incoming.createdAt ?? new Date().toISOString(),
  });

  return merged;
};

export async function mergeUsers(incomingUsers: StoredUser[]): Promise<StoredUser[]> {
  const candidates = (incomingUsers ?? []).filter((user) => Boolean(user?.username?.trim()));
  if (candidates.length === 0) {
    return getUsers();
  }

  const existingUsers = await getUsers();
  const userMap = new Map<string, StoredUser>();
  existingUsers.forEach((user) => {
    userMap.set(user.username.toLowerCase(), user);
  });

  let changed = false;
  for (const rawUser of candidates) {
    const key = rawUser.username.trim().toLowerCase();
    const existing = userMap.get(key);
    const merged = mergeUserRecord(existing, rawUser);
    if (!existing) {
      userMap.set(key, merged);
      changed = true;
      continue;
    }

    const before = JSON.stringify(existing);
    const after = JSON.stringify(merged);
    if (before !== after) {
      userMap.set(key, merged);
      changed = true;
    }
  }

  const consolidated = Array.from(userMap.values());
  if (changed) {
    await saveUsers(consolidated);
  }
  return consolidated;
}
