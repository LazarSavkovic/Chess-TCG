import { useGame } from "../context/GameContext";

  const ConfirmationModal = () => {
    const { confirmation, setConfirmation } = useGame()
    if (!confirmation) return null;
    return (
      <div id="confirmation-overlay" style={{ display: 'flex' }}>
        <div id="confirmation-box">
          <p id="confirmation-message">{confirmation.message}</p>
          <div className="confirmation-buttons">
            <button
              onClick={() => {
                confirmation.onYes();
                setConfirmation(null);
              }}
            >
              {confirmation.yesMessage}
            </button>
            <button
              onClick={() => {
                confirmation.onNo();
                setConfirmation(null);
              }}
            >
              {confirmation.noMessage}
            </button>
          </div>
        </div>
      </div>
    );
  };

  export default ConfirmationModal