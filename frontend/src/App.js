import React, { useState } from "react";
import "./App.css";

const App = () => {
  // Données en dur pour les salons et les utilisateurs
  const [channels, setChannels] = useState(["Général", "Gaming", "Tech", "Random"]);
  const [users, setUsers] = useState(["Alice", "Bob", "Charlie", "Eve"]);
  const [messages, setMessages] = useState([
    { user: "Alice", text: "Salut tout le monde !" },
    { user: "Bob", text: "Hello !" },
    { user: "Charlie", text: "Ça va ?" },
  ]);
  const [currentMessage, setCurrentMessage] = useState("");

  // Fonction pour envoyer un message
  const handleSendMessage = () => {
    if (currentMessage.trim() !== "") {
      setMessages([...messages, { user: "Moi", text: currentMessage }]);
      setCurrentMessage("");
    }
  };

  return (
    <div className="app">
      {/* Barre latérale gauche : Channels */}
      <div className="sidebar-left">
        <h3>Salons</h3>
        <ul>
          {channels.map((channel, index) => (
            <li key={index}>{channel}</li>
          ))}
        </ul>
      </div>

      {/* Section principale : Messages */}
      <div className="main-section">
        <div className="messages">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.user === "Moi" ? "my-message" : ""}`}>
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
          />
          <button onClick={handleSendMessage}>Envoyer</button>
        </div>
      </div>

      {/* Barre latérale droite : Utilisateurs */}
      <div className="sidebar-right">
        <h3>Utilisateurs</h3>
        <ul>
          {users.map((user, index) => (
            <li key={index}>{user}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default App;
