import React from "react";
import { useGame } from "../context/GameContext";
import Card from "./Card";

function LandDeckPopup() {
    const { userId, setSelectedHandIndex, landDeck1, landDeck2, showLandDeck, setShowLandDeck, setSelectedLandDeckIndex, highlightPlaceActivateZones } = useGame();
    const landDeck = userId === '1' ? landDeck1 : landDeck2;

    return showLandDeck ? (
        <div className="tutoring-popup-overlay">
            <div className="tutoring-popup-content">
                <h2>Your Land Deck</h2>
                <div className="tutoring-card-list">
                    {landDeck.map((card, i) => (
                        <div key={card.id} style={{ height: "22vw" }}
                            onClick={() => {
                                    setSelectedLandDeckIndex(i);
                                    setSelectedHandIndex(null)
                                    setShowLandDeck(false)
                                    highlightPlaceActivateZones(i, true);
                                    
                                
                            }}
                        >
                            <Card card={card} />
                        </div>
                    ))}
                </div>
                <button onClick={() => setShowLandDeck(false)}>Close</button>
            </div>
        </div>
    ) : null;
}

export default LandDeckPopup;
