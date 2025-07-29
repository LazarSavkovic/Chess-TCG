import Card from "./Card"
import { useGame } from "../context/GameContext";

function TutoringTargets({ showTutoringPopup, setShowTutoringPopup, tutoringTargets, wsRef }) {
    const {pendingSorcery} = useGame()

    function handleTutoringSelect(cardId) {
        console.log('tutoring', cardId, pendingSorcery)
        if (wsRef.current) {
            wsRef.current.send(
                JSON.stringify({
                    type: 'resolve-sorcery',
                    slot: pendingSorcery.slot,
                    card_id: cardId,
                })
            );
        }
        setShowTutoringPopup(false)
    }


    return (
        <>
            {showTutoringPopup && (
                <div className="tutoring-popup-overlay">
                    <div className="tutoring-popup-content">
                        <h2>Select a Target</h2>
                        <div className="tutoring-card-list">
                            {tutoringTargets.map((card) => (
                                <div key={card.id} style={{height: "22vw" }} onClick={() => handleTutoringSelect(card.id)}>
                                    <Card  card={card}  />
                                </div>
                                
                            ))}
                        </div>
                        <button onClick={() => setShowTutoringPopup(false)}>Cancel</button>
                    </div>
                </div>
            )}
        </>


    )
}

export default TutoringTargets