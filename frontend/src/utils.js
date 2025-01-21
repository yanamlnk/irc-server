export const UserExists = (username) => {
    // Exemple d'utilisation de l'événement "UserExists"
    // socket.emit("UserExists", username, (response) => {
    //   if (response.success) {
    //     console.log("UserExists response :", response);
    //   } else {
    //     console.error(response.message);
    //   }
    // });
  };
  
  export const setNickname = (newName, socket, currentUser, setCurrentUser) => {
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