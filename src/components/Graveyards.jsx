import { useGame } from "../context/GameContext";
import CardPreview from "./CardPreview";
import Card from "./Card";
// Render graveyards for player and opponent
function Graveyards() {
  const { 
    userId, 
    graveyard1, 
    graveyard2, 
    apiUrl,
    setShowGraveyard,
    setShowGraveyardPlayer
  } = useGame()
  const myGrave = userId === '1' ? graveyard1 : graveyard2;
  const oppGrave = userId === '1' ? graveyard2 : graveyard1;
  
  const handleGraveyardClick = (player) => {
    setShowGraveyardPlayer(player);
    setShowGraveyard(true);
  };
  return (
    <>
      <div 
        id="opponent-graveyard" 
        className="graveyard graveyard-clickable" 
        onClick={() => handleGraveyardClick(userId === '1' ? '2' : '1')}
        title="Click to view opponent's graveyard"
      >
        {oppGrave.map((card, index) => (
          <div
            key={card.id}
            id={`card-${card.id}`}
            className="grave-card-wrapper"
            style={{
              position: 'absolute',
              top: `${-index * 2}px`,
              left: `${-index * 2}px`,
              zIndex: 10 - index,
            }}
            title={card.name}
          >
            <Card card={card} fontSize="0.35rem" />
          </div>
        ))}
      </div>
      <CardPreview />

      <div 
        id="graveyard" 
        className="graveyard graveyard-clickable" 
        onClick={() => handleGraveyardClick(userId)}
        title="Click to view your graveyard"
      >
        {myGrave.map((card, index) => (
          <div
            key={card.id}
            id={`card-${card.id}`}
            className="grave-card-wrapper"
            style={{
              position: 'absolute',
              top: `${-index * 2}px`,
              left: `${-index * 2}px`,
              zIndex: 10 - index,
            }}
            title={card.name}
          >
            <Card card={card} fontSize="0.35rem" />
          </div>
        ))}
      </div>

    </>
  );
};

export default Graveyards