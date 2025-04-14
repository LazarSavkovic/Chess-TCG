import { useGame } from "../context/GameContext";
import CardPreview from "./CardPreview";
  // Render graveyards for player and opponent
function Graveyards() {
    const {userId, graveyard1, graveyard2, apiUrl} = useGame()
    const myGrave = userId === '1' ? graveyard1 : graveyard2;
    const oppGrave = userId === '1' ? graveyard2 : graveyard1;
    return (
      <>
        <div id="graveyard" className="graveyard">
          {myGrave.map((card, index) => (
            <div
              key={card.id}
              id={`card-${card.id}`}
              className="grave-card"
              style={{
                backgroundImage: `url(${apiUrl}/${card.image})`,
                top: `${-index * 2}px`,
                left: `${-index * 2}px`,
              }}
              title={card.name}
            ></div>
          ))}
        </div>
        <CardPreview />
        <div id="opponent-graveyard" className="graveyard">
          {oppGrave.map((card, index) => (
            <div
              key={card.id}
              id={`card-${card.id}`}
              className="grave-card"
              style={{
                backgroundImage: `url(${apiUrl}/${card.image})`,
                top: `${-index * 2}px`,
                left: `${-index * 2}px`,
              }}
              title={card.name}
            ></div>
          ))}
        </div>
      </>
    );
  };

  export default Graveyards