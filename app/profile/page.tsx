"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { getRankByElo } from "@/lib/rankSystem";

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

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [selectedIcon, setSelectedIcon] = useState("👤");
  const [selectedBanner, setSelectedBanner] = useState("#3b82f6");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("debatel_user");
    if (!storedUser) {
      router.push("/login");
      return;
    }
    const userData = JSON.parse(storedUser);
    setUser(userData);
    setSelectedIcon(userData.profileIcon || "👤");
    setSelectedBanner(userData.profileBanner || "#3b82f6");
  }, [router]);

  const handleSave = () => {
    setLoading(true);
    
    // Update current user session
    const updatedUser = {
      ...user,
      profileIcon: selectedIcon,
      profileBanner: selectedBanner,
    };
    localStorage.setItem("debatel_user", JSON.stringify(updatedUser));

    // Update in users list
    const storedUsers = localStorage.getItem("debatel_users");
    if (storedUsers) {
      const users = JSON.parse(storedUsers);
      const userIndex = users.findIndex((u: any) => u.username === user.username);
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], profileIcon: selectedIcon, profileBanner: selectedBanner };
        localStorage.setItem("debatel_users", JSON.stringify(users));
      }
    }

    setUser(updatedUser);
    setSuccess(true);
    setLoading(false);
    
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleResetElo = () => {
    if (!confirm("Are you sure you want to reset your ELO to 0? This cannot be undone.")) {
      return;
    }
    
    const updatedUser = { ...user, elo: 0 };
    localStorage.setItem("debatel_user", JSON.stringify(updatedUser));

    const storedUsers = localStorage.getItem("debatel_users");
    if (storedUsers) {
      const users = JSON.parse(storedUsers);
      const userIndex = users.findIndex((u: any) => u.username === user.username);
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], elo: 0 };
        localStorage.setItem("debatel_users", JSON.stringify(users));
      }
    }

    setUser(updatedUser);
    window.location.reload();
  };

  if (!user) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  }

  const rank = getRankByElo(user.elo !== undefined ? user.elo : 0);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="mb-8 text-4xl font-bold text-black">Profile Customization</h1>

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
                <div>
                  <div className="text-2xl font-bold text-black">{user.username}</div>
                  <div className={`text-sm font-semibold ${rank.color}`}>
                    {rank.icon} {rank.displayName} • {user.elo !== undefined ? user.elo : 0} ELO
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

        {/* Reset ELO Section */}
        <div className="mt-8 border-2 border-red-500 bg-red-50 p-6">
          <h3 className="mb-2 text-lg font-bold text-red-700">Danger Zone</h3>
          <p className="mb-4 text-sm text-gray-700">Reset your competitive ranking to start fresh.</p>
          <button
            onClick={handleResetElo}
            className="rounded-sm bg-red-600 px-6 py-2 font-semibold text-white transition hover:bg-red-700"
          >
            Reset ELO to 0
          </button>
        </div>
      </main>
    </div>
  );
}
