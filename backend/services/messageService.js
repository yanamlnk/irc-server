const Message = require('../models/messageModel');

//recupérer les msgs à un utilisateur spécifique
async function getMessagesForUser(userId) {
  try {
    return await Message.find({ recipient: userId, recipientType: 'User' })
      .populate('sender', 'name')
      .sort({ timestamp: 1 });
  } catch (err) {
    console.error('Error getting messages for user', err);
    throw err;
  }
}

//sauvegarder un msg
async function saveMessage({ text, sender, recipient, recipientType }) {
  try {
    const message = new Message({ text, sender, recipient, recipientType });
    return await message.save();
  } catch (err) {
    console.error('Error saving message', err);
    throw err;
  }
}

module.exports = { saveMessage, getMessagesForUser };
