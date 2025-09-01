import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { slugify } from "../util/export";
import { useGame } from "../context/GameContext";

// Small helper
function fmtDate(s) {
  try { return new Date(s).toLocaleString(); } catch { return s || ""; }
}

function EmptyState() {
  return (
    <div className="text-center py-16 text-slate-400">
      <div className="text-lg">No decks yet.</div>
      <div className="text-sm mt-1">Create one in the Deck Builder, then come back here.</div>
    </div>
  );
}

function DeckRow({ deck, onView, onMakeActive, onDelete }) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-700 bg-slate-900/60">
      <div className="min-w-0 flex gap-6">
        <div style={{height: "15vh"}} className="hand-card opponent-card user-2"></div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
          <div className="font-semibold text-slate-100 truncate">{deck.name}</div>
          {deck.is_active && (
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-600/20 text-emerald-300 border border-emerald-600/40">
              Active
            </span>
          )}
        </div>
        {deck.description && (
          <div className="text-xs text-slate-400 mt-1 truncate">{deck.description}</div>
        )}
        <div className="text-xs text-slate-500 mt-1">Created: {fmtDate(deck.created_at)}</div>
      </div>
          </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onView(deck)}
          className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-100 hover:bg-slate-600 text-sm"
        >
          View
        </button>
        {/* NEW: Link to edit mode (/builder/:deckId) */}
        <Link
          to={`/builder/${deck.id}`}
          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 text-sm"
        >
          Open
        </Link>
        {!deck.is_active && (
          <button
            onClick={() => onMakeActive(deck)}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 text-sm"
          >
            Make Active
          </button>
        )}
        <button
          onClick={() => onDelete(deck)}
          className="px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-500 text-sm"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function DeckDetailsModal({ open, onClose, deckId }) {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [deck, setDeck] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const { apiHost } = useGame()

  useEffect(() => {
    if (!open || !deckId) return;
    (async () => {
      setLoading(true);
      try {
        // fetch deck details (includes piles)
        const d = await fetch(`/api/decks/${deckId}`, {
          headers: { "X-Clerk-User-Id": userId },
        });
        const deckData = await d.json();

        // fetch catalog to resolve card_id → card data (name, image, etc.)
        const c = await fetch(`/api/cards`);
        const cat = await c.json();

        setDeck(deckData);
        setCatalog(cat);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, deckId, userId]);

  const byId = useMemo(() => {
    const m = new Map();
    for (const c of catalog) m.set(c.card_id, c);
    return m;
  }, [catalog]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="font-semibold text-slate-100">
            {deck?.name || "Deck"} {deck?.is_active ? <span className="ml-2 text-xs px-2 py-0.5 rounded bg-emerald-600/20 text-emerald-300 border border-emerald-600/40">Active</span> : null}
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-100 hover:bg-slate-600 text-sm"
          >
            Close
          </button>
        </div>

        {loading ? (
          <div className="p-6 text-slate-400">Loading…</div>
        ) : (
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
            {["MAIN", "LAND", "SIDE"].map((pile) => {
              const cards = deck?.piles?.[pile] || [];
              return (
                <div key={pile} className="rounded-xl border border-slate-800 bg-slate-900/60">
                  <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                    <div className="text-slate-200 font-semibold">{pile}</div>
                    <div className="text-xs text-slate-400">{cards.length} rows</div>
                  </div>
                  <div className="max-h-[50vh] overflow-auto divide-y divide-slate-800">
                    {cards.length === 0 ? (
                      <div className="p-4 text-sm text-slate-500">Empty</div>
                    ) : (
                      cards.map((row, i) => {
                        const c = byId.get(row.card_id);
                        return (
                          <div key={`${row.card_id}-${i}`} className="p-3 flex items-center gap-3">
                            {c?.image ? (
                              <img
                                src={`http://${apiHost}${c.image}` }
                                alt={c?.name || row.card_id}
                                className="w-10 h-14 object-cover rounded border border-slate-700"
                              />
                            ) : (
                              <div className="w-10 h-14 rounded border border-slate-700 bg-slate-800" />
                            )}
                            <div className="min-w-0">
                              <div className="text-sm text-slate-100 truncate">
                                {c?.name || row.card_id}
                              </div>
                              <div className="text-xs text-slate-400">
                                x{row.qty} {c?.type ? `· ${c.type}` : ""}
                                {c?.role ? ` · ${c.role}` : ""}
                                {c?.mana != null ? ` · ${c.mana} mana` : ""}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DecksPage() {
  const { userId } = useAuth();
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null); // deck id for modal



  const fileInputRef = React.useRef(null);

  function triggerUpload() {
    fileInputRef.current?.click();
  }


  async function createDeckFromExport(payload) {
    // basic validation
    if (!payload || typeof payload !== "object") throw new Error("Invalid file.");
    if (!payload.piles || typeof payload.piles !== "object") throw new Error("Missing piles.");
    const { MAIN = [], SIDE = [], LAND = [] } = payload.piles;

    // 1) create deck
    const createRes = await fetch(`/api/decks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Clerk-User-Id": userId,
      },
      body: JSON.stringify({
        name: (payload.name || "Imported Deck").slice(0, 120),
        description: payload.description || "",
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error("Failed to create deck: " + (err.error || createRes.statusText));
    }
    const created = await createRes.json();
    const newId = created.id;

    // 2) send piles (already compressed rows in the file)
    const pilesToSend = [
      ["MAIN", MAIN],
      ["SIDE", SIDE],
      ["LAND", LAND],
    ];

    for (const [pile, rows] of pilesToSend) {
      const res = await fetch(`/api/decks/${newId}/cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Clerk-User-Id": userId,
        },
        body: JSON.stringify({ pile, cards: rows }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Failed to import ${pile}: ` + (err.error || res.statusText));
      }
    }

    return newId;
  }

  async function onUploadFileSelected(e) {
    const file = e.target.files?.[0];
    // reset input so choosing same file again re-triggers
    e.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      // Optional: check version compatibility
      if (json.version && json.version !== 1) {
        const ok = window.confirm(
          `This file has version ${json.version}, expected 1. Try importing anyway?`
        );
        if (!ok) return;
      }

      const newId = await createDeckFromExport(json);
      alert("Deck imported!");
      await load(); // refresh lists
      // Optionally jump to builder:
      // window.location.assign(`/builder/${newId}`);
    } catch (err) {
      console.error(err);
      alert(err?.message || "Failed to import deck file.");
    }
  }


  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/decks`, {
        headers: { "X-Clerk-User-Id": userId },
      });
      const data = await res.json();
      setDecks(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (userId) load();
  }, [userId]);

  async function makeActive(deck) {
    await fetch(`/api/decks/${deck.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Clerk-User-Id": userId,
      },
      body: JSON.stringify({ is_active: true }),
    });
    load();
  }

  async function deleteDeck(deck) {
    if (!window.confirm(`Delete deck "${deck.name}"? This cannot be undone.`)) return;
    await fetch(`/api/decks/${deck.id}`, {
      method: "DELETE",
      headers: { "X-Clerk-User-Id": userId },
    });
    load();
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Your Decks</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={triggerUpload}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white"
              title="Upload a deck file exported from the builder"
            >
              Upload Deck
            </button>
            <a
              href="/builder"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Open Deck Builder
            </a>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.tdeck.json,application/json"
              className="hidden"
              onChange={onUploadFileSelected}
            />
          </div>
        </div>
        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="text-slate-400">Loading…</div>
          ) : decks.length === 0 ? (
            <EmptyState />
          ) : (
            decks.map((d) => (
              <DeckRow
                key={d.id}
                deck={d}
                onView={() => setViewing(d.id)}
                onMakeActive={makeActive}
                onDelete={deleteDeck}
              />
            ))
          )}
        </div>
      </div>

      <DeckDetailsModal
        open={!!viewing}
        onClose={() => setViewing(null)}
        deckId={viewing}
      />
    </div>
  );
}
