  export const setNickname = (newName, socket, currentUser, currentChannelId, setUsers, setCurrentUser) => {
    socket.emit("changeName", { userId: currentUser.id, newName, channelId: currentChannelId }, (response) => {
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
        setMessages(prevMessages => [
          ...prevMessages,
          { user: "Bot", text: `Liste des salons: ${response.channels.map((channel) => channel.name).join(", ")}`, channel: selectedChannel },
        ]);
      } else {
        console.error(response.message);
      }
    });
  };