"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual authentication
    // For now, just redirect to lobby
    router.push("/lobby");
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="mb-12 text-center">
            <Link href="/" className="inline-block border-4 border-black bg-white px-8 py-4 text-5xl font-bold tracking-tight text-black transition hover:bg-gray-50">
              DEBATLE
            </Link>
            <h2 className="mt-8 text-3xl font-bold text-black">Account Login</h2>
            <p className="mt-3 text-gray-600">Access your debate profile</p>
          </div>

          <div className="border-2 border-black bg-white p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
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

              <button
                type="submit"
                className="w-full bg-black py-4 font-bold uppercase tracking-wide text-white transition hover:bg-gray-800"
              >
                Login
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
