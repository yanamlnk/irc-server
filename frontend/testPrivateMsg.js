const { io } = require('socket.io-client');

const socket = io('http://localhost:3001', {
  transports: ['websocket', 'polling'],
});

async function runTest() {
  try {
    const testChannelID = '67851bfc665bea7c527c7193';
    const senderUserID = '67851a2310281ef2346d02af';
    const recipientName = 'Stete test';

    console.log('Attempting authentication...');
    socket.emit('authenticate', { userId: senderUserID });

    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('Attempting to send private message...');
    socket.emit('privateMessage', {
      text: 'Olá, esta é uma mensagem privada de teste',
      to: recipientName,
      channelId: testChannelID,
    });
  } catch (error) {
    console.error('Error during test:', error);
  }
}

socket.on('connect', () => {
  console.log('Connected to the server:', socket.id);
  runTest();
});

socket.on('privateMessageResponse', response => {
  console.log('Private message response:', response);
  if (response.success) {
    console.log('Message sent successfully!');
    setTimeout(() => {
      socket.disconnect();
      process.exit(0);
    }, 1000);
  } else {
    console.error('Error sending message:', response.message);
    process.exit(1);
  }
});

socket.on('newMessage', message => {
  console.log('New message received:', message);
});

socket.on('disconnect', () => {
  console.log('Disconnected from the server');
});

socket.on('connect_error', err => {
  console.error('Connection error:', err);
});

// Forçar encerramento após 10 segundos
setTimeout(() => {
  console.log('Timeout reached, forcing exit');
  process.exit(1);
}, 10000);
