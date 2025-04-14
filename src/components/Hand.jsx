import { useGame } from "../context/GameContext";
import HandCard from "./HandCard";
  // Render the player's hand
function Hand({ wsRef}) {
    const {hand1, hand2, userId} = useGame()
    const currentHand = userId === '1' ? hand1 : hand2;
    console.log(currentHand)
    return (
      <div id="hand">
        {currentHand.map((card, i) => (
<HandCard card={card} i={i} wsRef={wsRef} key={i} />
        ))}
      </div>
    );
  };

  export default Hand;