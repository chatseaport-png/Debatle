import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="border-b border-gray-300 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="border-2 border-black bg-white px-3 py-1 text-2xl font-bold tracking-tight text-black">DEBATLE</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 transition hover:text-black"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-sm bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="mx-auto max-w-4xl px-4 py-32 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="inline-block border-4 border-black bg-white px-12 py-8 text-7xl font-bold tracking-tight text-black sm:text-8xl">
            DEBATLE
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base text-gray-600">
            Competitive debate platform with timed turns and AI scoring
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/lobby"
              className="bg-black px-10 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-gray-800"
            >
              Enter Lobby
            </Link>
            <Link
              href="/leaderboard"
              className="border-2 border-gray-400 bg-white px-10 py-3 text-sm font-semibold uppercase tracking-wide text-gray-700 transition hover:border-black hover:text-black"
            >
              Rankings
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
