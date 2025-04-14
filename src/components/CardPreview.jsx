import { useGame } from "../context/GameContext";


  // Render card preview (shown when hovering on a card)
function CardPreview () {
const {cardPreview, apiUrl} = useGame()

    if (!cardPreview) return <div id="cardPreview" />;
    return (
      <div id="cardPreview">
        <div
          className={`play-card ${
            cardPreview.type === 'monster'
              ? 'monster-card'
              : cardPreview.type === 'sorcery'
              ? 'sorcery-card'
              : 'land-card'
          }`}
        >
          <div className="card-content">
            <div className="title-bar">
              {cardPreview.name}
              <div className="mana-cost">🩸 {cardPreview.mana || 0}</div>
            </div>
            <div
              className="card-image"
              style={{
                backgroundImage: `url(${apiUrl}/${cardPreview.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            ></div>
            <div className="type-line">
              {cardPreview.subtype || (cardPreview.type ? `(${cardPreview.type})` : '')}
            </div>
            <div className="rules-text">
              {cardPreview.text || cardPreview.description || 'No effect.'}
            </div>
            <div className="stats-bar">
              {cardPreview.attack && cardPreview.defense ? (
                <>
                  <span>ATK: {cardPreview.attack}</span>
                  <span>DEF: {cardPreview.defense}</span>
                </>
              ) : (
                <>
                  <span></span>
                  <span></span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  export default CardPreview