import React, { useEffect, useState } from "react";
import "./App.css";

const App = () => {
  // Données en dur pour les salons et les utilisateurs
  // 1# Déclarer la variable channels
  const [channels, setChannels] = useState(["Général", "Gaming", "Tech", "Random"]);
  const [users, setUsers] = useState(["Alice", "Bob", "Charlie", "Eve"]);
  const [messages, setMessages] = useState([
    { user: "Alice", text: "Salut tout le monde !" },
    { user: "Bob", text: "Hello !" },
    { user: "Charlie", text: "Ça va ?" },
  ]);
  const [username, setUsername] = useState("");
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");

  // Fonction pour envoyer un message
  const handleSendMessage = () => {
    if (currentMessage.trim() !== "") {
      setMessages([...messages, { user: "Moi", text: currentMessage }]);
      setCurrentMessage("");
    }
  };

  // 2# Ajouter un nouveau channel (créer la fonction)
  const handleAddChannel = () => {
    const newChannel = prompt("Entrez le nom du nouveau channel :");
    if (newChannel) {
      setChannels([...channels, newChannel]);
    }
  };

  // Fonction pour renommer un channel
  const handleRenameChannel = (index) => {
    const newChannelName = prompt("Entrez le nouveau nom du channel :");
    if (newChannelName) {
      const updatedChannels = [...channels];
      updatedChannels[index] = newChannelName;
      setChannels(updatedChannels);
    }
  };

  // Fonction pour supprimer un channel
  const handleDeleteChannel = (index) => {
    const updatedChannels = channels.filter((_, i) => i !== index);
    setChannels(updatedChannels);
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
  else {
    return (
      <div className="app">
        {/* Barre latérale gauche : Channels */}
        <div className="sidebar-left">
          <h3>Salons</h3>
          <button onClick={handleAddChannel}>+</button>
          <ul>
            {channels.map((channel, index) => (
              <li key={index}>
                {channel}
                <button onClick={() => handleRenameChannel(index)}>Renommer</button>
                <button onClick={() => handleDeleteChannel(index)}>Supprimer</button>
              </li>
            ))}
          </ul>
          {/* 3# appeler la fonction */}
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
  }
};

export default App;
