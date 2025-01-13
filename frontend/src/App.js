import React, { useEffect, useState } from "react";
import "./App.css";

const App = () => {
  // Données en dur pour les salons et les utilisateurs
  // 1# Déclarer la variable channels
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
  const [selectedChannel, setSelectedChannel] = useState("Général"); // État pour le channel sélectionné

  // Fonction pour envoyer un message
  const handleSendMessage = () => {
    if (currentMessage.trim() !== "") {
      setMessages([...messages, { user: username, text: currentMessage, channel: selectedChannel }]);
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
    if (selectedChannel === channels[index]) {
      setSelectedChannel(updatedChannels[0] || ""); // Sélectionner un autre channel si le channel actuel est supprimé
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
  else {
    return (
      <div className="app">
        {/* Barre latérale gauche : Channels/Discussions */}
        <div className="sidebar-left">
          <h3>Navigation</h3>
          <div className="navigation-buttons">
            <button onClick={() => setView("channels")}>Salons</button>
            <button onClick={() => setView("discussions")}>Discussions</button>
          </div>
          {view === "channels" ? (
            <>
              <div className="title-container">
                <h3>Salons</h3>
                <button className="add-channel-button" onClick={handleAddChannel}>+</button>
              </div>
              <ul>
                {channels.map((channel, index) => (
                  <li key={index} onClick={() => setSelectedChannel(channel)} className={selectedChannel === channel ? "selected" : ""}>
                    {channel}
                    <div>
                      <i className="fas fa-edit small" onClick={() => handleRenameChannel(index)}></i>
                      <i className="fas fa-trash-alt small" onClick={() => handleDeleteChannel(index)}></i>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <h3>Discussions</h3>
              <ul>
                {users.map((user, index) => (
                  <li key={index}>{user}</li>
                ))}
              </ul>
            </>
          )}
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
