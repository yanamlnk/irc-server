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
      if (currentMessage.startsWith("/")) {
        handleCommand(currentMessage);
      } else {
        // Logique pour envoyer un message normal
        sendMessage(currentMessage);
      }
      setCurrentMessage("");
    }
  };
  
  const handleCommand = (command) => {
    const [cmd, ...args] = command.slice(1).split(" ");
    switch (cmd) {
      case "nick":
        // Logique pour définir le surnom de l'utilisateur
        setNickname(args[0]);
        break;
      case "list":
        // Logique pour lister les canaux disponibles
        listChannels(args[0]);
        break;
      case "create":
        // Logique pour créer un canal
        createChannel(args[0]);
        break;
      case "delete":
        // Logique pour supprimer un canal
        deleteChannel(args[0]);
        break;
      case "join":
        // Logique pour rejoindre un canal
        joinChannel(args[0]);
        break;
      case "quit":
        // Logique pour quitter un canal
        quitChannel(args[0]);
        break;
      case "users":
        // Logique pour lister les utilisateurs dans le canal
        listUsers();
        break;
      case "msg":
        // Logique pour envoyer un message privé
        sendPrivateMessage(args[0], args.slice(1).join(" "));
        break;
      default:
        console.log("Commande inconnue");
    }
  };

  const sendMessage = (message) => {
    setMessages([...messages, { user: username, text: currentMessage, channel: selectedChannel }]);
    // Logique pour envoyer un message normal
  };

  const setNickname = (nickname) => {
    console.log(`Surnom défini: ${nickname}`);
    // Logique pour définir le surnom de l'utilisateur
  };

  const listChannels = (filter) => {
    console.log(`Liste des canaux${filter ? ` avec filtre: ${filter}` : ""}`);
    // Logique pour lister les canaux disponibles
  };

  const createChannel = (channel) => {
    console.log(`Canal créé: ${channel}`);
    // Logique pour créer un canal
  };

  const deleteChannel = (channel) => {
    console.log(`Canal supprimé: ${channel}`);
    // Logique pour supprimer un canal
  };

  const joinChannel = (channel) => {
    console.log(`Rejoint le canal: ${channel}`);
    // Logique pour rejoindre un canal
  };

  const quitChannel = (channel) => {
    console.log(`Quitte le canal: ${channel}`);
    // Logique pour quitter un canal
  };

  const listUsers = () => {
    console.log("Liste des utilisateurs dans le canal");
    // Logique pour lister les utilisateurs dans le canal
  };

  const sendPrivateMessage = (nickname, message) => {
    console.log(`Message privé à ${nickname}: ${message}`);
    // Logique pour envoyer un message privé
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
        </div>

        {view === "channels" ? (
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
        ) : (
          <ul>
            {users.map((user, index) => (
              <li key={index}>{user}</li>
            ))}
          </ul>
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
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSendMessage();
              }
            }}
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
