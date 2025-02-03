const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  text: { type: String, required: true },
  sender: { type: String, required: true },
  recipientType: {
    type: String,
    required: true,
    enum: ['Channel', 'User'],
  },
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: function () {
      return this.recipientType === 'Channel';
    },
  },
  timestamp: { type: Date, default: Date.now },
});

messageSchema.index({ recipient: 1, recipientType: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
