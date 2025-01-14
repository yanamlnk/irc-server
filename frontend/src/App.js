import React, { useState } from "react";
import "./App.css";
import { executeCommand } from "./services/commandes";

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSendMessage = () => {
    if (currentMessage.trim() !== "") {
      if (currentMessage.startsWith("/")) {
        handleCommand(currentMessage);
      } else {
        sendMessage(currentMessage);
      }
      setCurrentMessage("");
    }
  };

  const handleCommand = (command) => {
    const [cmd, ...args] = command.slice(1).split(" ");
    const context = {
      setNickname: (nickname) => setUsername(nickname),
      listChannels: (filter) => console.log(`Liste des canaux${filter ? ` avec filtre: ${filter}` : ""}`),
      createChannel: (channel) => console.log(`Canal créé: ${channel}`),
      deleteChannel: (channel) => console.log(`Canal supprimé: ${channel}`),
      joinChannel: (channel) => console.log(`Rejoint le canal: ${channel}`),
      quitChannel: (channel) => console.log(`Quitte le canal: ${channel}`),
      listUsers: () => console.log("Liste des utilisateurs dans le canal"),
      sendPrivateMessage: (nickname, message) => console.log(`Message privé à ${nickname}: ${message}`)
    };
    executeCommand(cmd, args, context);
  };

  const sendMessage = (message) => {
    setMessages([...messages, { user: username, text: currentMessage, channel: selectedChannel }]);
  };

  const handleSetUsername = (name) => {
    if (!name) {
      name = `User${Math.floor(Math.random() * 1000)}`;
    }
    setUsername(name);
    setIsUsernameSet(true);
  };

  const handleRenameChannel = (channel) => {
    const newName = prompt("Entrez le nouveau nom du canal :", channel);
    if (newName && newName.trim() !== "") {
      setChannels((prevChannels) =>
        prevChannels.map((ch) => (ch === channel ? newName : ch))
      );
      console.log(`Canal renommé de ${channel} à ${newName}`);
      if (selectedChannel === channel) {
        setSelectedChannel(newName);
      }
    }
  };

  const handleDeleteChannel = (channel) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le canal "${channel}" ?`)) {
      setChannels((prevChannels) => prevChannels.filter((ch) => ch !== channel));
      console.log(`Canal supprimé : ${channel}`);
      if (selectedChannel === channel) {
        setSelectedChannel(channels[0] || ""); // Sélectionne un autre canal
      }
    }
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
      <button
        className="menu-burger"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        ☰
      </button>

      <div className={`sidebar-left ${isMenuOpen ? "open" : ""}`}>
        <h3>Navigation</h3>
        {/* <div className="navigation-buttons">
          <button
            className={view === "channels" ? "active" : ""}
            onClick={() => setView("channels")}
          >
            Salons
          </button>
          <button
            className={view === "discussions" ? "active" : ""}
            onClick={() => setView("discussions")}
          >
            Discussions
          </button>
        </div> */}

        {view === "channels" ? (
          <ul>
            {channels.map((channel, index) => (
              <li
                key={index}
                className={selectedChannel === channel ? "selected" : ""}
              >
                <span
                  onClick={() => {
                    setSelectedChannel(channel);
                    setIsMenuOpen(false);
                  }}
                >
                  {channel}
                </span>
                <div className="channel-actions">
                  <i
                    className="fas fa-edit small"
                    title="Renommer"
                    onClick={() => handleRenameChannel(channel)}
                  ></i>
                  <i
                    className="fas fa-trash-alt small"
                    title="Supprimer"
                    onClick={() => handleDeleteChannel(channel)}
                  ></i>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <ul>
            {users.map((user, index) => (
              <li key={index}>{user}</li>
            ))}
          </ul>
        )}
      </div>

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
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSendMessage();
              }
            }}
          />
          <button onClick={handleSendMessage}>Envoyer</button>
        </div>
      </div>

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
