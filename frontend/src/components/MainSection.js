import React from "react";

const MainSection = ({ messages, selectedChannel, currentUser, currentMessage, setCurrentMessage, handleSendMessage }) => {
  return (
    <div className="main-section">
      <div className="messages">
        {messages
          .filter((message) => message.channel === selectedChannel)
          .map((message, index) => (
            <div key={index} className={`message ${message.user === currentUser.name ? "my-message" : ""}`}>
              <strong>{message.user}:</strong> {message.text}
            </div>
          ))}
      </div>
      <div className="input-section">
        <input
          type="text"
          placeholder="Écris un message..."
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSendMessage();
            }
          }}
        />
        <button onClick={handleSendMessage}>Envoyer</button>
      </div>
    </div>
  );
};

export default MainSection;