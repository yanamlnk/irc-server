const { getUserByName } = require('../services/userService');
const { getMessagesForUser, saveMessage } = require('../services/messageService');

function messageSocket(socket) {
  console.log('User connected:', socket.id);

  //choisir un nom d'utilisateur
  socket.on('choose name', async name => {
    try {
      const user = await getUserByName(name);

      if (!user) {
        socket.emit('error', { message: 'User does not exist' });
        return;
      }

      //associer le socket id au nom d'utilisateur
      socket.userId = user._id;

      //récupérer l'historique des messages pour l'utilisateur
      const messages = await getMessagesForUser(user._id);
      socket.emit('message history', messages);
    } catch (err) {
      console.error('Error handling choose name:', err);
      socket.emit('error', { message: 'Error choosing name' });
    }
  });

  socket.on('change name', async ({ currentName, newName }) => {
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

  //envoyer un message privé
  socket.on('private message', async ({ text, to }) => {
    try {
      const recipient = await getUserByName(to);

      if (!recipient) {
        socket.emit('error', { message: `User "${to}" does not exist` });
        return;
      }

      //sauvegarder le message dans la db
      const message = await saveMessage({
        text,
        sender: socket.userId,
        recipient: recipient._id,
        recipientType: 'User',
      });

      //envoie le msg au destinataire
      socket.to(recipient._id.toString()).emit('private message', {
        text: message.text,
        from: socket.userId,
      });
    } catch (err) {
      console.error('Error sending private message:', err);
      socket.emit('error', { message: 'Error sending private message' });
    }
  });
}

module.exports = messageSocket;
