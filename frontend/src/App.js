import React, { useState, useEffect } from "react";
import socket from "./socket";
import UsernameForm from "./components/UsernameForm";
import Sidebar from "./components/Sidebar";
import MainSection from "./components/MainSection";
import UserList from "./components/UserList";
import { UserExists, setNickname, listChannels } from "./utils";
import "./App.css";

const App = () => {
  const [currentUser, setCurrentUser] = useState("");
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [view, setView] = useState("channels");
  const [selectedChannel, setSelectedChannel] = useState("General");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [channels, setChannels] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (isUsernameSet) {
      if (UserExists(currentUser)) {
        //
      } else {
        // Si l'utilisateur n'existe pas, on crée un nouvel utilisateur et on l'associe par défaut au salon "Général"
      }
      socket.emit('authenticate', { userId: currentUser.id });
      connectionUser();
    }
  }, [isUsernameSet]);

  useEffect(() => {
    if (channels.length > 0) {
      listUsersInChannel();
    }
  }, [selectedChannel, channels]);

  useEffect(() => {
    socket.on('userJoinedChannel', ({ userId, channelId, userName }) => {
      if(userName != currentUser.name){
        alert(`${userName} a rejoint le channel !`);
      }
    });

    return () => {
      socket.off('userJoinedChannel');
    };
  }, []);

  const connectionUser = () => {
    listChannelsOfUser(currentUser.id);
    joinChannel(currentUser.id, "General");
  };

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
    switch (cmd) {
      case "nick":
        setNickname(args[0], socket, currentUser, setUsers, setCurrentUser);
        listChannelsOfUser(currentUser.id);
        break;
      case "list":
        listChannels(args[0], socket, setMessages, messages, selectedChannel);
        break;
      case "create":
        createChannel(currentUser.id, args[0]);
        break;
      case "delete":
        deleteChannel(args[0], "name");
        break;
      case "join":
        joinChannel(currentUser.id, args[0]);
        break;
      case "quit":
        quitChannel(currentUser.id, args[0]);
        break;
      case "users":
        listUsersInChannel(true);
        break;
      case "msg":
        // sendPrivateMessage(args[0], args.slice(1).join(" "));
        break;
      default:
        console.log("Commande inconnue");
    }
  };

  const sendMessage = (message) => {
    setMessages([...messages, { user: currentUser.name, text: currentMessage, channel: selectedChannel }]);
  };

  const handleSetUsername = (name) => {
    if (!name) {
      name = `User${Math.floor(Math.random() * 1000)}`;
    }

    setCurrentUser({
      id: "67851a5c62459a1ecaf85957",
      name: "Yaya test"
    });
    setIsUsernameSet(true);
  };

  const listChannelsOfUser = (userId, filter = "") => {
    socket.emit("listChannelsOfUser", userId, (response) => {
      if (response.success) {
        setChannels(response.channels);
      } else {
        console.error(response.message);
      }
    });
  };

  const listUsersInChannel = (requestCommand = false) => {
    const channelId = channels.find((channel) => channel.name === selectedChannel)?.channel_id;
    socket.emit("listUsersInChannel", channelId, (response) => {
      if (response.success) {
        if(requestCommand) {
          setMessages([
            ...messages,
            { user: "Bot", text: `Liste des utilisateurs du salon: ${response.users.map((user) => user.name).join(", ")}`, channel: selectedChannel },
          ]);
        }
        setUsers(response.users);
      } else {
        console.error(response.message);
      }
    });
  };

  const joinChannel = (userId, channelName) => {
    socket.emit("joinChannel", { userId, channelName }, (response) => {
      if (response.success) {
        listChannelsOfUser(userId);
        setSelectedChannel(channelName);
      } else {
        console.error(response.message);
      }
    });
  };

  const createChannel = (userId, name) => {
    socket.emit("createChannel", { userId, name }, (response) => {
      if (response.success) {
        listChannelsOfUser(userId);
      } else {
        console.error(response.message);
      }
    });
  };

  const quitChannel = (userId, channelName) => {
    const channelId = channels.find((channel) => channel.name === channelName).channel_id;
    socket.emit("quitChannel", { userId, channelId }, (response) => {
      if (response.success) {
        listChannelsOfUser(userId);
      } else {
        console.error(response.message);
      }
    });
  };

  const renameChannel = (channelId) => {
    let newName = prompt("Entrez le nouveau nom du salon");
    if (newName) {
      socket.emit("renameChannel", { channelId, newName }, (response) => {
        if (response.success) {
          setChannels(
            channels.map((channel) =>
              channel.channel_id === channelId ? { ...channel, name: newName } : channel
            )
          );
        } else {
          console.error(response.message);
        }
      });
    }
  };

  const deleteChannel = (channelId, type = "id") => {
    if (type === "name") {
      const channel = channels.find((channel) => channel.name.toLowerCase().replace(/\s/g, "") === channelId.toLowerCase().replace(/\s/g, ""));
      if (channel) {
        channelId = channel.channel_id;
      }
    }
    socket.emit("deleteChannel", channelId, (response) => {
      if (response.success) {
        setChannels(channels.filter((channel) => channel.channel_id !== channelId));
      } else {
        console.error(response.message);
      }
    });
  };

  if (!isUsernameSet) {
    return <UsernameForm handleSetUsername={handleSetUsername} />;
  }

  return (
    <div className="app">
      <button className="menu-burger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        ☰
      </button>
      <Sidebar
        view={view}
        setView={setView}
        channels={channels}
        selectedChannel={selectedChannel}
        setSelectedChannel={setSelectedChannel}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        renameChannel={renameChannel}
        deleteChannel={deleteChannel}
        users={users}
      />
      <MainSection
        messages={messages}
        selectedChannel={selectedChannel}
        currentUser={currentUser}
        currentMessage={currentMessage}
        setCurrentMessage={setCurrentMessage}
        handleSendMessage={handleSendMessage}
      />
      <UserList users={users} />
    </div>
  );
};

export default App;