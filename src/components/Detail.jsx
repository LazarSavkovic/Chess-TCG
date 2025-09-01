import React, { useMemo } from "react";
import { useGame } from "../context/GameContext";
import ManaBar from "./ManaBar";
import { useUser } from "@clerk/clerk-react";

function Detail() {
  const { userId, mana, deckSizes } = useGame();
  const { user, isLoaded, isSignedIn } = useUser();

  // Prefer Clerk username; fall back to email local-part; then Clerk ID; else "Guest"
  const displayName = useMemo(() => {
    if (!isLoaded || !isSignedIn) return "Guest";
    return (
      user?.username ||
      user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
      user?.id ||
      "Guest"
    );
  }, [isLoaded, isSignedIn, user]);

  return (
    <div className="detail">
      <h2 id="userH2">{displayName.toUpperCase()}</h2>

      <ManaBar mana={mana[userId]} />

      <div className="hand-card opponent-card user-2">
        🂠
        <h6 id="deckCount">
          {deckSizes
            ? `${deckSizes[userId]} card${deckSizes[userId] === 1 ? "" : "s"}`
            : "?"}
        </h6>
      </div>
    </div>
  );
}

export default Detail;
