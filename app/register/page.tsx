"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { StoredUser } from "@/lib/types";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsernameLower = normalizedUsername.toLowerCase();

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords don't match!");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    if (normalizedUsername.length < 3) {
      setError("Username must be at least 3 characters");
      setLoading(false);
      return;
    }

    try {
      // Get existing users from localStorage
      const storedUsers = localStorage.getItem("debatel_users");
      let users: StoredUser[] = [];
      if (storedUsers) {
        try {
          users = JSON.parse(storedUsers) as StoredUser[];
        } catch (error) {
          console.error("Failed to parse stored users", error);
        }
      }

      // Check if email already exists
      if (users.some((u) => (u.email ?? "").toLowerCase() === normalizedEmail)) {
        setError("An account with this email already exists");
        setLoading(false);
        return;
      }

      // Check if username already exists
      if (users.some((u) => (u.username ?? "").toLowerCase() === normalizedUsernameLower)) {
        setError("This username is already taken");
        setLoading(false);
        return;
      }

      // Add new user
      const newUser = {
        username: normalizedUsername,
        email: normalizedEmail,
        password, // In production, this should be hashed
        createdAt: new Date().toISOString(),
        elo: 0, // Starting ELO
        profileIcon: "👤", // Default icon
        profileBanner: "#3b82f6", // Default banner color (blue)
        rankedWins: 0,
        rankedLosses: 0
      };

      users.push(newUser);
      localStorage.setItem("debatel_users", JSON.stringify(users));
      console.log(`✅ Registered new user: ${newUser.username} (Total users: ${users.length})`);

      // Store logged-in user
      localStorage.setItem("debatel_user", JSON.stringify({
        username: newUser.username,
        email: newUser.email,
        elo: newUser.elo,
        profileIcon: newUser.profileIcon,
        profileBanner: newUser.profileBanner,
        rankedWins: newUser.rankedWins,
        rankedLosses: newUser.rankedLosses
      }));

      // Trigger storage event for navbar update
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("debatelUsersUpdated"));
      console.log("✅ Dispatched debatelUsersUpdated event after registration");

      // Redirect to lobby
      router.push("/lobby");
    } catch {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-300 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center">
            <Link href="/" className="border-2 border-black bg-white px-3 py-1 text-2xl font-bold tracking-tight text-black transition hover:bg-gray-50">
              DEBATEL
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-black">Create Account</h2>
          </div>

          <div className="border-2 border-black bg-white p-10">
            {error && (
              <div className="mb-6 border-2 border-red-500 bg-red-50 px-4 py-3 text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-bold uppercase tracking-wide text-black">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-2 w-full border-2 border-gray-300 px-4 py-3 text-black focus:border-black focus:outline-none"
                  placeholder="Your debate name"
                  required
                  disabled={loading}
                  minLength={3}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-bold uppercase tracking-wide text-black">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full border-2 border-gray-300 px-4 py-3 text-black focus:border-black focus:outline-none"
                  placeholder="your.email@example.com"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-bold uppercase tracking-wide text-black">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 w-full border-2 border-gray-300 px-4 py-3 text-black focus:border-black focus:outline-none"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-bold uppercase tracking-wide text-black">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-2 w-full border-2 border-gray-300 px-4 py-3 text-black focus:border-black focus:outline-none"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black py-4 font-bold uppercase tracking-wide text-white transition hover:bg-gray-800 disabled:bg-gray-400"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <div className="mt-8 border-t border-gray-200 pt-6 text-center text-sm text-gray-600">
              Already registered?{" "}
              <Link href="/login" className="font-semibold text-black hover:underline">
                Login here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
