import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useParams, useNavigate } from "react-router-dom";
import Card from "./Card";
import CardPreview from "./CardPreview";
import { buildDeckExport, downloadJson, compressById, slugify } from "../util/export";

const PILES = ["MAIN", "SIDE", "LAND"];


// expand [{card_id, qty}] -> repeated card specs using catalog map
function expandRows(rows, byId) {
  const out = [];
  const sorted = [...rows].sort((a, b) => {
    const pa = a.position ?? 0, pb = b.position ?? 0;
    if (pa !== pb) return pa - pb;
    return (a.card_id || "").localeCompare(b.card_id || "");
  });
  for (const r of sorted) {
    const spec = byId.get(r.card_id);
    if (!spec) continue; // unknown id (skip gracefully)
    for (let i = 0; i < (r.qty || 1); i++) out.push(spec);
  }
  return out;
}

// ----- UI bits -----
function CardThumb({ c, onAdd, onHover, draggable = true, hovered = false }) {
  return (
    <div
      className={`relative w-28 group rounded-xl border p-2 cursor-grab active:cursor-grabbing select-none ${
        hovered 
          ? 'bg-blue-600/60 border-blue-500' 
          : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700 rounded-xl'
      }`}
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData("application/json", JSON.stringify(c));
        e.dataTransfer.setData("text/plain", c.card_id);
      }}
      onDoubleClick={() => onAdd?.(c)}
      onMouseEnter={() => onHover?.(c)}
      onMouseLeave={() => onHover?.(null)}
      title={`${c.name}${c.mana != null ? ` · ${c.mana} mana` : ""}`}
    >
      <div className="w-24">
        <Card card={c} fontSize={window.innerWidth < 1000 ? "3px" : "6px"} />
      </div>
      {onAdd && (
        <button
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition text-xs px-2 py-1 rounded bg-emerald-600 text-white"
          onClick={() => onAdd(c)}
        >
          Add
        </button>
      )}
    </div>
  );
}

function Pile({ name, cards, onAdd, onRemove, onClear, onHover, hoveredCardId }) {
  return (
    <div
      className="rounded-2xl border border-slate-700 bg-slate-900/60 h-full min-h-0 flex flex-col"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const raw = e.dataTransfer.getData("application/json");
        if (!raw) return;
        try { onAdd(JSON.parse(raw)); } catch { }
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
        <div className="text-slate-200 font-semibold">{name}</div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{cards.length} cards</span>
          {cards.length > 0 && (
            <button
              className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-200 hover:bg-slate-600"
              onClick={onClear}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="p-3 grid grid-cols-7 gap-3 auto-rows-min flex-1 min-h-0 overflow-y-auto">
        {cards.map((c, i) => (
          <div key={`${c.card_id}-${i}`} className="relative ">
            <CardThumb 
              c={c} 
              draggable={false} 
              onHover={onHover}
              hovered={hoveredCardId === c.card_id}
            />
            <button
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-600 text-white text-xs"
              title="Remove"
              onClick={() => onRemove(i)}
            >
              ✕
            </button>
          </div>
        ))}
        {cards.length === 0 && (
          <div className="text-sm text-slate-500 italic p-4">
            Drag cards here or double-click a card to add.
          </div>
        )}
      </div>
    </div>
  );
}

export default function DeckBuilder() {
  const { userId } = useAuth();
  const { deckId: routeDeckId } = useParams();     // /builder (create) OR /builder/:deckId (edit)
  const navigate = useNavigate();

  const [deckId, setDeckId] = useState(routeDeckId || null);
  const [deckName, setDeckName] = useState("");
  const [deckDesc, setDeckDesc] = useState("");
  const [isActive, setIsActive] = useState(false);

  const [catalog, setCatalog] = useState([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const [piles, setPiles] = useState({ MAIN: [], SIDE: [], LAND: [] });
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);


  function downloadDeck() {
    const payload = buildDeckExport({ deckName, deckDesc, piles });
    const base = slugify(deckName) || "deck";
    // include short timestamp for uniqueness
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${base}-${stamp}.tdeck.json`; // custom extension if you like
    downloadJson(payload, filename);
  }


  // Fetch catalog first
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/cards`);
        const data = await res.json();
        setCatalog(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Build a quick lookup by card_id
  const byId = useMemo(() => {
    const m = new Map();
    for (const c of catalog) m.set(c.card_id, c);
    return m;
  }, [catalog]);

  // If editing: load deck once catalog is ready
  useEffect(() => {
    if (!routeDeckId || catalog.length === 0) return;

    (async () => {
      const res = await fetch(`/api/decks/${routeDeckId}`, {
        headers: { "X-Clerk-User-Id": userId },
      });
      if (!res.ok) {
        alert("Failed to load deck.");
        return;
      }
      const d = await res.json();
      setDeckId(d.id);
      setDeckName(d.name || "");
      setDeckDesc(d.description || "");
      setIsActive(!!d.is_active);

      const mainRows = d.piles?.MAIN || [];
      const sideRows = d.piles?.SIDE || [];
      const landRows = d.piles?.LAND || [];

      setPiles({
        MAIN: expandRows(mainRows, byId),
        SIDE: expandRows(sideRows, byId),
        LAND: expandRows(landRows, byId),
      });
    })();
  }, [routeDeckId, catalog.length, userId, byId]);

  const filtered = useMemo(() => {
    return catalog.filter((c) => {
      if (typeFilter !== "ALL" && (c.type || "").toLowerCase() !== typeFilter) return false;
      if (roleFilter !== "ALL" && (c.role || "").toLowerCase() !== roleFilter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const hay = `${c.name || ""} ${c.card_id || ""} ${c.text || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [catalog, query, typeFilter, roleFilter]);

  const addTo = (pileName, card) => setPiles((p) => ({ ...p, [pileName]: [...p[pileName], card] }));
  const removeFrom = (pileName, idx) =>
    setPiles((p) => {
      const copy = [...p[pileName]];
      copy.splice(idx, 1);
      return { ...p, [pileName]: copy };
    });
  const clearPile = (pileName) => setPiles((p) => ({ ...p, [pileName]: [] }));

  async function saveDeck() {
    if (!userId) return alert("You must be signed in to save a deck.");
    if (!deckName.trim()) return alert("Please enter a deck name.");

    let id = deckId;

    // Create or update deck metadata
    if (!id) {
      const mk = await fetch(`/api/decks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Clerk-User-Id": userId,
        },
        body: JSON.stringify({ name: deckName.trim(), description: deckDesc || "" }),
      });
      if (!mk.ok) {
        const err = await mk.json().catch(() => ({}));
        return alert("Failed to create deck: " + (err.error || mk.statusText));
      }
      const j = await mk.json();
      id = j.id;
      setDeckId(id);
    } else {
      const up = await fetch(`/api/decks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Clerk-User-Id": userId,
        },
        body: JSON.stringify({ name: deckName.trim(), description: deckDesc }),
      });
      if (!up.ok) {
        const err = await up.json().catch(() => ({}));
        return alert("Failed to update deck: " + (err.error || up.statusText));
      }
    }

    // Replace each pile
    for (const pileName of PILES) {
      const body = { pile: pileName, cards: compressById(piles[pileName]) };
      const res = await fetch(`/api/decks/${id}/cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Clerk-User-Id": userId,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return alert(`Failed to save ${pileName}: ` + (err.error || res.statusText));
      }
    }

    alert("Deck saved!");
    // If it was a new deck, optionally navigate to edit URL
    if (!routeDeckId && id) navigate(`/builder/${id}`, { replace: true });
  }

  async function makeActive() {
    if (!deckId) return;
    const res = await fetch(`/api/decks/${deckId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Clerk-User-Id": userId,
      },
      body: JSON.stringify({ is_active: true }),
    });
    if (res.ok) {
      setIsActive(true);
      alert("Deck set as active.");
    } else {
      const err = await res.json().catch(() => ({}));
      alert("Failed to set active: " + (err.error || res.statusText));
    }
  }

  async function deleteDeck() {
    if (!deckId) return;
    if (!window.confirm(`Delete deck "${deckName}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/decks/${deckId}`, {
      method: "DELETE",
      headers: { "X-Clerk-User-Id": userId },
    });
    if (res.ok) {
      alert("Deck deleted.");
      navigate("/decks");
    } else {
      const err = await res.json().catch(() => ({}));
      alert("Failed to delete: " + (err.error || res.statusText));
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 pt-24 pb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{deckId ? "Edit Deck" : "Deck Builder"}</h1>
            <input
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 outline-none"
              placeholder="Deck name…"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
            />
            <input
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 outline-none w-72"
              placeholder="Description…"
              value={deckDesc}
              onChange={(e) => setDeckDesc(e.target.value)}
            />
            {deckId && isActive && (
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-600/20 text-emerald-300 border border-emerald-600/40">
                Active
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadDeck}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white"
              title="Export this deck as a file you can upload later"
            >
              Download Deck
            </button>
            {deckId && !isActive && (
              <button
                onClick={makeActive}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Make Active
              </button>
            )}
            {deckId && (
              <button
                onClick={deleteDeck}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white"
              >
                Delete
              </button>
            )}
            <button
              onClick={saveDeck}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {deckId ? "Save Changes" : "Save Deck"}
            </button>
          </div>
        </div>
      </div>

      {/* content */}
      <div className="max-w-full mx-auto px-4 pb-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* card preview */}
        <aside className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/60 overflow-hidden sticky top-24">
            <div className="border-b border-slate-800 p-4">
              <h3 className="text-lg font-semibold">Card Preview</h3>
              <p className="text-xs text-slate-500 mt-1">Hover over cards to preview</p>
            </div>
            <div className="p-4 flex justify-center">
              {selectedCard ? (
                <div className="w-64">
                  <Card card={selectedCard} />
                </div>
              ) : (
                <div className="w-64 h-96 flex items-center justify-center text-slate-500 border border-slate-700 rounded-lg">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🔍</div>
                    <div className="text-sm">Hover over a card to preview</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* piles */}
        <div className="flex flex-col gap-6 lg:col-span-8 min-h-0">
          <div className="w-full h-[60vh] min-h-0">
            <Pile
              name="MAIN"
              cards={piles.MAIN}
              onAdd={(c) => addTo("MAIN", c)}
              onRemove={(i) => removeFrom("MAIN", i)}
              onClear={() => clearPile("MAIN")}
              onHover={setSelectedCard}
              hoveredCardId={selectedCard?.card_id}
            />
          </div>
          <div className="w-full h-[30vh] min-h-0">
            <Pile
              name="LAND"
              cards={piles.LAND}
              onAdd={(c) => addTo("LAND", c)}
              onRemove={(i) => removeFrom("LAND", i)}
              onClear={() => clearPile("LAND")}
              onHover={setSelectedCard}
              hoveredCardId={selectedCard?.card_id}
            />
          </div>
  
          <div className="w-full h-[30vh] min-h-0">
            <Pile
              name="SIDE"
              cards={piles.SIDE}
              onAdd={(c) => addTo("SIDE", c)}
              onRemove={(i) => removeFrom("SIDE", i)}
              onClear={() => clearPile("SIDE")}
              onHover={setSelectedCard}
              hoveredCardId={selectedCard?.card_id}
            />
          </div>

        </div>

        {/* card catalog */}
        <aside className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/60 overflow-hidden">
            <div className="border-b border-slate-800 p-3">
              <div className="flex flex-col gap-2">
                <input
                  placeholder="Search name / text / id…"
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 outline-none"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <select
                  className="px-2 py-2 rounded-lg bg-slate-800 border border-slate-700"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="ALL">All Types</option>
                  <option value="monster">Monsters</option>
                  <option value="sorcery">Sorceries</option>
                  <option value="land">Lands</option>
                </select>
                <select
                  className="px-2 py-2 rounded-lg bg-slate-800 border border-slate-700 "
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="ALL">All Roles</option>
                  <option value="red">Red</option>
                  <option value="blue">Blue</option>
                  <option value="white">White</option>
                  <option value="black">Black</option>
                </select>
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Drag a card into a pile or double-click to add.
              </div>
            </div>

            <div className="p-3 grid grid-cols-2 gap-3 max-h-[70vh] overflow-auto">
              {filtered.map((c) => (
                <CardThumb
                  key={c.card_id}
                  c={c}
                  onAdd={(card) => addTo(card.type === "land" ? "LAND" : "MAIN", card)}
                  onHover={setSelectedCard}
                  hovered={selectedCard?.card_id === c.card_id}
                />
              ))}
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
