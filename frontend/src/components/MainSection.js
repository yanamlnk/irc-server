import React, { useEffect } from "react";

const MainSection = ({ messages, selectedChannel, currentUser, currentMessage, setCurrentMessage, handleSendMessage, messagesEndRef, errorMessage }) => {
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="main-section">
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      <div className="messages">
        {messages
          .filter((message) => message.channel === selectedChannel)
          .map((message, index) => (
            <div
              key={index}
              className={`message ${message.user === currentUser.name ? "my-message" : ""} ${message.isPrivate ? "private-message" : ""}`}
            >
              <strong>{message.user}:</strong> {message.text}
            </div>
          ))}
        <div ref={messagesEndRef} />
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
      Nom utilisateur : {currentUser.name}
    </div>
  );
};

export default MainSection;