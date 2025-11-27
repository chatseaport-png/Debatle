"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { StoredUser } from "@/lib/types";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotUsername, setShowForgotUsername] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const router = useRouter();

  const handleForgotUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMessage("");

    const normalizedEmail = forgotEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      setForgotMessage("Please enter a valid email address");
      return;
    }

    try {
      const response = await fetch("/api/users/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail })
      });

      const payload = await response.json().catch(() => ({ message: "Unable to find account" }));
      if (!response.ok) {
        setForgotMessage(payload.message ?? "No account found with this email address");
        return;
      }

      const user = payload.user as StoredUser | undefined;
      if (user?.username) {
        setForgotMessage(`Your username is: ${user.username}`);
      } else {
        setForgotMessage("No account found with this email address");
      }
    } catch (error) {
      console.error("Failed to lookup username", error);
      setForgotMessage("Unable to lookup username. Please try again later.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const normalizedIdentifier = identifier.trim();
    const normalizedIdentifierLower = normalizedIdentifier.toLowerCase();

    try {
      const response = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: normalizedIdentifierLower, password })
      });

      const payload = await response.json().catch(() => ({ message: "Login failed" }));
      if (!response.ok) {
        setError(payload.message ?? "Invalid credentials");
        setLoading(false);
        return;
      }

      const user = payload.user as StoredUser | undefined;
      const users = (payload.users as StoredUser[] | undefined) ?? [];

      if (users.length > 0) {
        localStorage.setItem("debatel_users", JSON.stringify(users));
      }

      if (!user) {
        setError("Unable to load user profile");
        setLoading(false);
        return;
      }

      const sessionUser: StoredUser = {
        username: user.username,
        email: user.email,
        elo: user.elo ?? 0,
        profileIcon: user.profileIcon ?? "👤",
        profileBanner: user.profileBanner ?? "#3b82f6",
        rankedWins: user.rankedWins ?? 0,
        rankedLosses: user.rankedLosses ?? 0
      };

      localStorage.setItem("debatel_user", JSON.stringify(sessionUser));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("debatelUsersUpdated"));
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
            <h2 className="text-3xl font-bold text-black">Account Login</h2>
          </div>

          {/* Forgot Username Modal */}
          {showForgotUsername && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
              <div className="w-full max-w-md border-2 border-black bg-white p-8">
                <h3 className="mb-4 text-2xl font-bold text-black">Forgot Username</h3>
                <p className="mb-6 text-sm text-gray-600">
                  Enter your email address and we&apos;ll show you your username.
                </p>

                {forgotMessage && (
                  <div
                    className={`mb-4 border-2 px-4 py-3 ${
                      forgotMessage.includes("No account")
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-green-500 bg-green-50 text-green-700"
                    }`}
                  >
                    {forgotMessage}
                  </div>
                )}

                <form onSubmit={handleForgotUsername} className="space-y-4">
                  <div>
                    <label htmlFor="forgotEmail" className="block text-sm font-bold uppercase tracking-wide text-black">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="forgotEmail"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="mt-2 w-full border-2 border-gray-300 px-4 py-3 text-black focus:border-black focus:outline-none"
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-black py-3 font-bold uppercase tracking-wide text-white transition hover:bg-gray-800"
                    >
                      Find Username
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotUsername(false);
                        setForgotMessage("");
                        setForgotEmail("");
                      }}
                      className="flex-1 border-2 border-black bg-white py-3 font-bold uppercase tracking-wide text-black transition hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="border-2 border-black bg-white p-10">
            {error && (
              <div className="mb-6 border-2 border-red-500 bg-red-50 px-4 py-3 text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="identifier" className="block text-sm font-bold uppercase tracking-wide text-black">
                  Username or Email
                </label>
                <input
                  type="text"
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="mt-2 w-full border-2 border-gray-300 px-4 py-3 text-black focus:border-black focus:outline-none"
                  placeholder="your.email@example.com or username"
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
                />
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowForgotUsername(true)}
                  className="text-sm font-semibold text-black hover:underline"
                >
                  Forgot Username?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black py-4 font-bold uppercase tracking-wide text-white transition hover:bg-gray-800 disabled:bg-gray-400"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <div className="mt-8 border-t border-gray-200 pt-6 text-center text-sm text-gray-600">
              No account yet?{" "}
              <Link href="/register" className="font-semibold text-black hover:underline">
                Create one here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
