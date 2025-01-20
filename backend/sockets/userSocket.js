const { getUserByName, updateUserName } = require('../services/userService');
const User = require('../models/User');

function userSocket(socket) {
  //choisir un nom d'utilisateur
  socket.on('chooseName', async name => {
    try {
      const user = await getUserByName(name);

      if (!user) {
        socket.emit('error', { message: 'User does not exist' });
        return;
      }

      //met à jour la socket id de l'user._id qui a été retrouvé dans la db avec la fonction getuserbyname
      user = await user.findByIdAndUpdate(user._id, { socketId: socket.id }, { new: true });
      //associer le socket.id a l'instance d'utilisateur permet au server d'envoyer des msgs au bon socket d'utilisateur ainsi que de persister les données
      socket.userId = user._id; //identifier de façon unique l'utilisateur associé à cette connexion de socket, de façon à que le server sache quel utilisateur est connecté à ce socket
      socket.userName = user.name; //garde le nom d'utilisateur associé à cette connexion de socket, plus facile de l'identifier que par l'id

      socket.emit('name chosen', { userId: user._id, userName: user.name });
    } catch (err) {
      console.error('Error handling choose name:', err);
      socket.emit('error', { message: 'Error choosing name' });
    }
  });

  socket.on('changeName', async ({ currentName, newName }) => {
    try {
      const user = await getUserByName(currentName);

      if (!user) {
        socket.emit('error', { message: 'Current user does not exist' });
        return;
      }

      const updatedUser = await updateUserName(user._id, newName);

      // mettre à jour le nom associé au socket
      console.log(`User "${currentName}" changed name to "${newName}"`);
      socket.emit('name changed', { newName });
    } catch (err) {
      console.error('Error changing name:', err);
      socket.emit('error', { message: 'Error changing name' });
    }
  });

  //lorsque l'utilisateur se deconnecte, nettoie le socket id
  socket.on('disconnect', async () => {
    if (socket.userId) {
      await User.findByIdAndUpdate(socket.userId, { socketId: null });
    }
  });
}

module.exports = userSocket;
