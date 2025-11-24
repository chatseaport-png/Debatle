"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Get stored users from localStorage
      const storedUsers = localStorage.getItem("debatel_users");
      const users = storedUsers ? JSON.parse(storedUsers) : [];

      // Find user with matching email OR username
      const user = users.find((u: any) => 
        u.email === identifier || u.username === identifier
      );

      if (!user) {
        setError("No account found with this username or email");
        setLoading(false);
        return;
      }

      if (user.password !== password) {
        setError("Incorrect password");
        setLoading(false);
        return;
      }

      // Store logged-in user (migrate old users without elo/icon/banner)
      localStorage.setItem("debatel_user", JSON.stringify({
        username: user.username,
        email: user.email,
        elo: user.elo || 1000,
        profileIcon: user.profileIcon || "👤",
        profileBanner: user.profileBanner || "#3b82f6"
      }));

      // Trigger storage event for navbar update
      window.dispatchEvent(new Event("storage"));

      // Redirect to lobby
      router.push("/lobby");
    } catch (err) {
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
