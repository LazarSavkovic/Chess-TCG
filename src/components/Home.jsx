// components/Home.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";

function newRoomId() {
  // compact, URL-safe room id
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 6)
  ).toLowerCase();
}

export default function Home() {
  const navigate = useNavigate();
  const [joinId, setJoinId] = useState("");

  const handleCreate = () => {
    const id = newRoomId();
    navigate(`/room/${encodeURIComponent(id)}`);
  };

  const handleJoin = (e) => {
    e?.preventDefault();
    const trimmed = (joinId || "").trim();
    if (!trimmed) return;
    navigate(`/room/${encodeURIComponent(trimmed)}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 text-slate-100">
      {/* top decoration */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-fuchsia-600/20 blur-3xl" />
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-14 pb-10 md:pt-20 md:pb-16">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
            Monsters &amp; Monarchs
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300 md:text-lg">
            Summon creatures, shape the land, and outwit your rival in a fast,
            tactical duel. Built for quick matches and big brain plays.
          </p>

          <SignedIn>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={handleCreate}
                className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-400/40"
              >
                Create Room
              </button>

              <form
                onSubmit={handleJoin}
                className="flex w-full max-w-md items-center gap-2 rounded-xl bg-slate-800/60 p-2 ring-1 ring-white/10"
              >
                <input
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value)}
                  placeholder="Enter room ID to join"
                  className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-600 focus:outline-none focus:ring-4 focus:ring-slate-500/40"
                >
                  Join
                </button>
              </form>
            </div>
          </SignedIn>

          <SignedOut>
            <div className="mt-8">
              <SignInButton mode="modal">
                <button className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-400/40">
                  Sign in to Play
                </button>
              </SignInButton>
              <p className="mt-3 text-sm text-slate-400">
                You must be signed in to create or join rooms.
              </p>
            </div>
          </SignedOut>
        </div>
      </section>

      {/* Feature grid */}
      <section className="mx-auto max-w-6xl px-6 pb-10 md:pb-16">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              title: "Summon & Strike",
              desc:
                "Bring monsters to the field and maneuver with directional movement for tactical advantage.",
              icon: (
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6 text-indigo-400"
                  fill="currentColor"
                >
                  <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" />
                </svg>
              ),
            },
            {
              title: "Shape the Land",
              desc:
                "Place lands to unlock activations and power spikes. Free or paid plays are clearly highlighted.",
              icon: (
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6 text-emerald-400"
                  fill="currentColor"
                >
                  <path d="M12 3l9 7-9 7-9-7 9-7zm0 18l9-7 2 1.5-11 8.5-11-8.5L3 14l9 7z" />
                </svg>
              ),
            },
            {
              title: "Clerk Secure",
              desc:
                "Accounts powered by Clerk. Your rooms and progress are tied to your user.",
              icon: (
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6 text-sky-400"
                  fill="currentColor"
                >
                  <path d="M12 1l9 5v6c0 5-3.8 9.7-9 11-5.2-1.3-9-6-9-11V6l9-5zm0 4.2L6 7.7V12c0 3.9 2.5 7.4 6 8.6 3.5-1.2 6-4.7 6-8.6V7.7l-6-2.5z" />
                </svg>
              ),
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 backdrop-blur-sm"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
              </div>
              <p className="text-sm leading-6 text-slate-300">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="mb-6 text-center text-2xl font-bold md:text-3xl">
          How it works
        </h2>
        <ol className="mx-auto grid max-w-4xl gap-4 md:grid-cols-3">
          {[
            {
              n: 1,
              t: "Sign in",
              d: "Use Clerk to sign in. This links your profile & sessions.",
            },
            { n: 2, t: "Create or Join", d: "Make a new room or enter a room ID." },
            {
              n: 3,
              t: "Play",
              d: "Summon monsters, place lands, cast sorceries, and seize the throne.",
            },
          ].map((s) => (
            <li
              key={s.n}
              className="rounded-2xl border border-white/10 bg-slate-900/50 p-5"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600/20 text-indigo-300">
                {s.n}
              </div>
              <h3 className="text-base font-semibold">{s.t}</h3>
              <p className="mt-1 text-sm text-slate-300">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-950/40 py-8 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} Monsters &amp; Monarchs
      </footer>
    </main>
  );
}
