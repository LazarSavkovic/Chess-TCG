import { useGame } from "../context/GameContext";
import Card from "./Card";


  // Render card preview (shown when hovering on a card)
function CardPreview () {
const {cardPreview} = useGame()

    if (!cardPreview) return <div id="cardPreview" />;
    return (
      <div id="cardPreview">
        <Card card={cardPreview} fontSize={window.innerWidth < 1000 ? '7px' : '14px'} />
      </div>
    );
  };

  export default CardPreview