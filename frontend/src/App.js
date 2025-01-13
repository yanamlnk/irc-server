import React, { useState } from "react";
import "./App.css";

const App = () => {
  const [channels, setChannels] = useState(["Général", "Gaming", "Tech", "Random"]);
  const [users, setUsers] = useState(["Alice", "Bob", "Charlie", "Eve"]);
  const [messages, setMessages] = useState([
    { user: "Alice", text: "Salut tout le monde !", channel: "Général" },
    { user: "Bob", text: "Hello !", channel: "Général" },
    { user: "Charlie", text: "Ça va ?", channel: "Général" },
  ]);
  const [username, setUsername] = useState("");
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [view, setView] = useState("channels");
  const [selectedChannel, setSelectedChannel] = useState("Général");
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Contrôle du menu burger

  const handleSendMessage = () => {
    if (currentMessage.trim() !== "") {
      setMessages([...messages, { user: username, text: currentMessage, channel: selectedChannel }]);
      setCurrentMessage("");
    }
  };

  const handleSetUsername = (name) => {
    if (!name) {
      name = `User${Math.floor(Math.random() * 1000)}`;
    }
    setUsername(name);
    setIsUsernameSet(true);
  };

  if (!isUsernameSet) {
    return (
      <div className="app">
        <h1>Bienvenue !</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSetUsername(e.target.elements.username.value);
          }}
        >
          <input type="text" name="username" placeholder="Entrez votre nom d'utilisateur" />
          <button type="submit">Valider</button>
          <button type="button" onClick={() => handleSetUsername("")}>
            Générer un nom aléatoire
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Bouton menu burger */}
      <button
        className="menu-burger"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        ☰
      </button>

      {/* Barre latérale gauche */}
      <div className={`sidebar-left ${isMenuOpen ? "open" : ""}`}>
        <h3>Navigation</h3>
        <div className="navigation-buttons">
          <button onClick={() => setView("channels")}>Salons</button>
          <button onClick={() => setView("discussions")}>Discussions</button>
        </div>
        <ul>
          {channels.map((channel, index) => (
            <li
              key={index}
              onClick={() => {
                setSelectedChannel(channel);
                setIsMenuOpen(false); // Fermer le menu burger après sélection
              }}
              className={selectedChannel === channel ? "selected" : ""}
            >
              {channel}
            </li>
          ))}
        </ul>
      </div>

      {/* Section principale : Messages */}
      <div className="main-section">
        <div className="messages">
          {messages
            .filter((message) => message.channel === selectedChannel)
            .map((message, index) => (
              <div key={index} className={`message ${message.user === username ? "my-message" : ""}`}>
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

      {/* Barre latérale droite */}
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
