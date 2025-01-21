  export const setNickname = (newName, socket, currentUser, setUsers, setCurrentUser) => {
    socket.emit("changeName", { currentUserName: currentUser.name, newName }, (response) => {
      if (response.success) {
        setCurrentUser({ ...currentUser, name: response.newName });
      } else {
        console.error(response.message);
      }
    });
  };
  
  export const listChannels = (filter, socket, setMessages, messages, selectedChannel) => {
    socket.emit("listChannels", filter, (response) => {
      if (response.success) {
        setMessages([
          ...messages,
          { user: "Bot", text: `Liste des salons: ${response.channels.map((channel) => channel.name).join(", ")}`, channel: selectedChannel },
        ]);
      } else {
        console.error(response.message);
      }
    });
  };