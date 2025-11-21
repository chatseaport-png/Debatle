"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    // TODO: Implement actual registration
    // For now, just redirect to lobby
    router.push("/lobby");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-300 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center">
            <Link href="/" className="border-2 border-black bg-white px-3 py-1 text-2xl font-bold tracking-tight text-black transition hover:bg-gray-50">
              DEBATLE
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
                />
              </div>

              <button
                type="submit"
                className="w-full bg-black py-4 font-bold uppercase tracking-wide text-white transition hover:bg-gray-800"
              >
                Create Account
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
