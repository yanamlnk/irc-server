const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  text: { type: String, required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'recipientType',
  },
  recipientType: {
    type: String,
    required: true,
    enum: ['User', 'Channel'],
  },
  channelContext: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: function () {
      return this.recipientType === 'User';
    },
  },
  timestamp: { type: Date, default: Date.now },
});

messageSchema.index({ recipient: 1, recipientType: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
