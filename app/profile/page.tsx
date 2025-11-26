"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { getRankByElo } from "@/lib/rankSystem";
import { StoredUser } from "@/lib/types";

const availableIcons = ["👤", "😀", "😎", "🤓", "🧠", "👨‍💼", "👩‍💼", "🦸", "🦹", "🤖", "👽", "🎭", "🎪", "⚡", "🔥", "💎", "👑", "🏆"];
const availableColors = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Red", value: "#ef4444" },
  { name: "Green", value: "#10b981" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Pink", value: "#ec4899" },
  { name: "Orange", value: "#f97316" },
  { name: "Yellow", value: "#eab308" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Black", value: "#000000" },
];

const parseStoredUser = (rawValue: string | null): StoredUser | null => {
  if (!rawValue) return null;
  try {
    return JSON.parse(rawValue) as StoredUser;
  } catch (error) {
    console.error("Failed to parse stored user", error);
    return null;
  }
};

const parseStoredUsers = (rawValue: string | null): StoredUser[] => {
  if (!rawValue) return [];
  try {
    const parsed = JSON.parse(rawValue) as StoredUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to parse stored users", error);
    return [];
  }
};

export default function Profile() {
  const router = useRouter();
  const initialUser = typeof window === "undefined" ? null : parseStoredUser(window.localStorage.getItem("debatel_user"));
  const initialRecentChange = typeof window === "undefined" ? null : window.localStorage.getItem("debatel_recent_elo_change");
  const initialEloChange = initialRecentChange ? parseInt(initialRecentChange, 10) : null;
  const [user, setUser] = useState<StoredUser | null>(initialUser);
  const [selectedIcon, setSelectedIcon] = useState(initialUser?.profileIcon ?? "👤");
  const [selectedBanner, setSelectedBanner] = useState(initialUser?.profileBanner ?? "#3b82f6");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [eloChange, setEloChange] = useState<number | null>(initialEloChange);
  const [showEloChange, setShowEloChange] = useState(Boolean(initialRecentChange));

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    // Listen for storage changes (ELO updates from other tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "debatel_user" && e.newValue) {
        const updatedUser = parseStoredUser(e.newValue);
        if (updatedUser) {
          setUser(updatedUser);
          setSelectedIcon(updatedUser.profileIcon ?? "👤");
          setSelectedBanner(updatedUser.profileBanner ?? "#3b82f6");
        }
      }
      if (e.key === "debatel_recent_elo_change" && e.newValue) {
        const change = parseInt(e.newValue);
        setEloChange(change);
        setShowEloChange(true);
      }
    };

    const handleUsersUpdated = () => {
      const updatedUser = parseStoredUser(window.localStorage.getItem("debatel_user"));
      if (updatedUser) {
        setUser(updatedUser);
        setSelectedIcon(updatedUser.profileIcon ?? "👤");
        setSelectedBanner(updatedUser.profileBanner ?? "#3b82f6");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("debatelUsersUpdated", handleUsersUpdated);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("debatelUsersUpdated", handleUsersUpdated);
    };
  }, [router, user]);

  useEffect(() => {
    if (!showEloChange) return;
    const timeoutId = window.setTimeout(() => {
      setShowEloChange(false);
      window.localStorage.removeItem("debatel_recent_elo_change");
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [showEloChange]);

  const handleSave = () => {
    setLoading(true);
    
    // Update current user session
    if (!user) {
      setLoading(false);
      return;
    }

    const updatedUser: StoredUser = {
      ...user,
      profileIcon: selectedIcon,
      profileBanner: selectedBanner,
    };
    localStorage.setItem("debatel_user", JSON.stringify(updatedUser));

    // Update in users list
    const storedUsers = parseStoredUsers(localStorage.getItem("debatel_users"));
    if (storedUsers.length > 0) {
      const userIndex = storedUsers.findIndex((u) => u.username === user.username);
      if (userIndex !== -1) {
        storedUsers[userIndex] = {
          ...storedUsers[userIndex],
          profileIcon: selectedIcon,
          profileBanner: selectedBanner,
        };
        localStorage.setItem("debatel_users", JSON.stringify(storedUsers));
      }
    }

    setUser(updatedUser);
    setSuccess(true);
    setLoading(false);
    window.dispatchEvent(new Event("debatelUsersUpdated"));
    
    setTimeout(() => setSuccess(false), 3000);
  };

  if (!user) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  }

  const rank = getRankByElo(user.elo ?? 0);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="mb-8 text-4xl font-bold text-black">Profile Customization</h1>

        {/* ELO Change Notification */}
        {showEloChange && eloChange !== null && (
          <div className={`mb-4 animate-pulse rounded-lg border-2 p-4 text-center text-xl font-bold ${
            eloChange > 0 
              ? 'border-green-500 bg-green-50 text-green-700' 
              : eloChange < 0 
              ? 'border-red-500 bg-red-50 text-red-700'
              : 'border-gray-500 bg-gray-50 text-gray-700'
          }`}>
            {eloChange > 0 ? '+' : ''}{eloChange} ELO {eloChange > 0 ? '🎉' : eloChange < 0 ? '😔' : ''}
          </div>
        )}

        {/* Preview Card */}
        <div className="mb-8 border-2 border-black bg-white p-6">
          <h2 className="mb-4 text-xl font-bold text-black">Preview</h2>
          <div className="overflow-hidden rounded-lg border-2 border-black">
            {/* Banner */}
            <div 
              className="h-32 w-full" 
              style={{ backgroundColor: selectedBanner }}
            ></div>
            {/* Profile Info */}
            <div className="bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="text-6xl">{selectedIcon}</div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-black">{user.username}</div>
                  <div className={`text-sm font-semibold ${rank.color}`}>
                    {rank.icon} {rank.displayName} • {user.elo !== undefined ? user.elo : 0} ELO
                  </div>
                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-gray-600">Progress to Next Rank</span>
                      <span className="font-semibold text-gray-900">{rank.progress}%</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                      <div 
                        className={`h-full transition-all duration-1000 ease-out ${rank.color.replace('text-', 'bg-')}`}
                        style={{ width: `${rank.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Icon Selection */}
        <div className="mb-6 border border-gray-300 bg-white p-6">
          <h3 className="mb-4 text-lg font-bold text-black">Profile Icon</h3>
          <div className="grid grid-cols-6 gap-3 sm:grid-cols-9 md:grid-cols-12">
            {availableIcons.map((icon) => (
              <button
                key={icon}
                onClick={() => setSelectedIcon(icon)}
                className={`rounded-lg border-2 p-4 text-4xl transition hover:scale-110 ${
                  selectedIcon === icon
                    ? "border-black bg-gray-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Banner Color Selection */}
        <div className="mb-6 border border-gray-300 bg-white p-6">
          <h3 className="mb-4 text-lg font-bold text-black">Banner Color</h3>
          <div className="grid grid-cols-5 gap-3 sm:grid-cols-10">
            {availableColors.map((color) => (
              <button
                key={color.value}
                onClick={() => setSelectedBanner(color.value)}
                className={`h-16 w-full rounded-lg border-2 transition hover:scale-105 ${
                  selectedBanner === color.value
                    ? "border-black ring-2 ring-black ring-offset-2"
                    : "border-gray-300"
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              ></button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className="rounded-sm bg-black px-8 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
          {success && (
            <span className="font-semibold text-green-600">✓ Profile updated!</span>
          )}
          <Link
            href="/lobby"
            className="font-semibold text-gray-700 hover:text-black"
          >
            Back to Lobby
          </Link>
        </div>
      </main>
    </div>
  );
}
