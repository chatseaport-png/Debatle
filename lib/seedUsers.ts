// Seed users that appear in everyone's leaderboard
// This ensures the rankings always have some users to display

import { StoredUser } from "./types";

export const SEED_USERS: StoredUser[] = [
  {
    username: "DebateMaster",
    email: "master@debatel.com",
    password: "demo123",
    elo: 1200,
    rankedWins: 24,
    rankedLosses: 6,
    profileIcon: "🏆",
    profileBanner: "#fbbf24",
    createdAt: new Date("2024-01-01").toISOString()
  },
  {
    username: "LogicLord",
    email: "logic@debatel.com",
    password: "demo123",
    elo: 950,
    rankedWins: 18,
    rankedLosses: 12,
    profileIcon: "🧠",
    profileBanner: "#8b5cf6",
    createdAt: new Date("2024-01-15").toISOString()
  },
  {
    username: "ArgumentAce",
    email: "ace@debatel.com",
    password: "demo123",
    elo: 750,
    rankedWins: 12,
    rankedLosses: 13,
    profileIcon: "⚡",
    profileBanner: "#3b82f6",
    createdAt: new Date("2024-02-01").toISOString()
  },
  {
    username: "RhetoricRookie",
    email: "rookie@debatel.com",
    password: "demo123",
    elo: 450,
    rankedWins: 8,
    rankedLosses: 17,
    profileIcon: "🌱",
    profileBanner: "#10b981",
    createdAt: new Date("2024-03-01").toISOString()
  },
  {
    username: "SpeechStar",
    email: "star@debatel.com",
    password: "demo123",
    elo: 300,
    rankedWins: 5,
    rankedLosses: 15,
    profileIcon: "⭐",
    profileBanner: "#ef4444",
    createdAt: new Date("2024-03-15").toISOString()
  }
];

// Initialize seed users if localStorage is empty
export function initializeSeedUsers(): void {
  if (typeof window === "undefined") return;
  
  const existingUsers = localStorage.getItem("debatel_users");
  
  // Only seed if there are no users at all
  if (!existingUsers || existingUsers === "[]") {
    localStorage.setItem("debatel_users", JSON.stringify(SEED_USERS));
    console.log("✅ Initialized seed users for leaderboard");
    window.dispatchEvent(new Event("debatelUsersUpdated"));
  }
}

// Ensure seed users are always present (merge with existing users)
export function ensureSeedUsers(): StoredUser[] {
  if (typeof window === "undefined") return SEED_USERS;
  
  const existingRaw = localStorage.getItem("debatel_users");
  let existingUsers: StoredUser[] = [];
  
  try {
    if (existingRaw) {
      existingUsers = JSON.parse(existingRaw) as StoredUser[];
    }
  } catch (error) {
    console.error("Failed to parse existing users", error);
    existingUsers = [];
  }
  
  // Create a map of existing users by username
  const userMap = new Map<string, StoredUser>();
  
  // Add seed users first
  SEED_USERS.forEach(user => {
    userMap.set(user.username.toLowerCase(), user);
  });
  
  // Override with existing users (so real users take precedence)
  existingUsers.forEach(user => {
    if (user.username) {
      userMap.set(user.username.toLowerCase(), user);
    }
  });
  
  return Array.from(userMap.values());
}
