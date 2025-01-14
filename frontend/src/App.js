import React, { useState, useEffect, use } from "react";
import io from "socket.io-client";
import { executeCommand } from "./services/commandes";
import "./App.css";

const socket = io("http://localhost:3001"); // Remplacez par l'URL de votre serveur

const App = () => {
  const [username, setUsername] = useState("");
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [view, setView] = useState("channels");
  const [selectedChannel, setSelectedChannel] = useState("Général");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [channels, setChannels] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (isUsernameSet) {
      console.log(username.id);
      listChannelsOfUser(username.id);
      // createChannel(username.id, "Généralee");
    }
  }, [isUsernameSet]);

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
      listChannels: (filter) => listChannelsOfUser(username, filter),
      createChannel: (channel) => createChannel(username, channel),
      deleteChannel: (channel) => deleteChannel(channel),
      joinChannel: (channel) => connectUserToChannel(username, channel),
      quitChannel: (channel) => quitChannel(username, channel),
      listUsers: () => listUsersInChannel(selectedChannel),
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
    /* TEST  */
    /*
    id = 67851a436bb2fce92a835c0f
    name = Stete test
    */
   setUsername({
    id: "67851a5c62459a1ecaf85957",
    name: "Yaya test"
   });
    // setUsername(name);
    setIsUsernameSet(true);
  };

  const listChannelsOfUser = (userId, filter = "") => {
    console.log("before listChannelsOfUser :", userId);
    socket.emit("listChannelsOfUser", userId, (response) => {
      if (response.success) {
        setChannels(response.channels.filter(channel => channel.name.includes(filter)));
        console.log("after listChannelsOfUser :");
        console.log(response);
      } else {
        console.error(response.message);
      }
    });
  };

  const listUsersInChannel = (channelId) => {
    socket.emit("listUsersInChannel", channelId, (response) => {
      if (response.success) {
        setUsers(response.users);
      } else {
        console.error(response.message);
      }
    });
  };

  const connectUserToChannel = (userId, channelId) => {
    socket.emit("connectUserToChannel", { userId, channelId }, (response) => {
      if (response.success) {
        listChannelsOfUser(userId);
      } else {
        console.error(response.message);
      }
    });
  };

  const createChannel = (userId, name) => {
    socket.emit("createChannel", { userId, name }, (response) => {
      if (response.success) {
        console.log("createChannel response :", response);
        listChannelsOfUser(userId);
      } else {
        console.error(response.message);
      }
    });
  };

  const quitChannel = (userId, channelId) => {
    socket.emit("quitChannel", { userId, channelId }, (response) => {
      if (response.success) {
        listChannelsOfUser(userId);
      } else {
        console.error(response.message);
      }
    });
  };

  const renameChannel = (channelId, newName) => {
    socket.emit("renameChannel", { channelId, newName }, (response) => {
      if (response.success) {
        listChannelsOfUser(username);
      } else {
        console.error(response.message);
      }
    });
  };

  const deleteChannel = (channelId) => {
    socket.emit("deleteChannel", channelId, (response) => {
      if (response.success) {
        listChannelsOfUser(username);
      } else {
        console.error(response.message);
      }
    });
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
                key={channel.channel_id || index} // Utilisez une clé unique (id) si disponible
                className={selectedChannel === channel.name ? "selected" : ""}
              >
                <span
                  onClick={() => {
                    setSelectedChannel(channel.name); // Sélectionnez le nom du canal
                    setIsMenuOpen(false); // Fermez le menu burger
                  }}
                >
                  {channel.name} {/* Affichez le nom du canal */}
                </span>
                <div className="channel-actions">
                  <i
                    className="fas fa-edit small"
                    title="Renommer"
                    onClick={() => renameChannel(channel.channel_id, "NouveauNom")} // Passez l'ID du canal
                  ></i>
                  <i
                    className="fas fa-trash-alt small"
                    title="Supprimer"
                    onClick={() => deleteChannel(channel.channel_id)} // Passez l'ID du canal
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
