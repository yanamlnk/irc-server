const { getUserByName } = require('../services/userService');
const { saveMessage } = require('../services/messageService');

function messageSocket(io, socket) {
  //envoyer un message privé
  socket.on('privateMessage', async ({ text, to }) => {
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
        channelId: socket.currentChannel,
      });

      const populatedMessage = await message
        .findById(message._id)
        .populate('sender', 'name')
        .populate('recipient', 'name');

      //envoie le msg à l'utilisateur qui l'a envoyé pour la consistance dans l'UI
      socket.emit('privateMessage', {
        message: populatedMessage,
        isSent: true,
      });

      //envoie le msg si l'utilisateur est en ligne
      if (recipient.socketId) {
        io.to(recipient.socketId).emit('privateMessage', {
          message: populatedMessage,
          isSent: false,
        });
      }
    } catch (err) {
      console.error('Error sending private message:', err);
      socket.emit('error', { message: 'Error sending private message' });
    }
  });
}

module.exports = messageSocket;
