const { io } = require('socket.io-client');

const socket = io('http://localhost:3001', {
  transports: ['websocket', 'polling'],
});

async function runTest() {
  try {
    const testChannelID = '67851bfc665bea7c527c7193';
    const senderUserID = '67851a2310281ef2346d02af';

    console.log('Attempting authentication...');
    socket.emit('authenticate', { userId: senderUserID });

    // Adicionar callback ao joinChannel
    console.log('Joining channel...');
    socket.emit(
      'joinChannel',
      {
        userId: senderUserID,
        channelName: 'Lindos',
      },
      response => {
        console.log('Join channel response:', response);

        if (response.success) {
          console.log('Attempting to send channel message...');
          socket.emit('channelMessage', {
            text: 'Olá, esta é uma mensagem para o canal!',
            channelId: testChannelID,
          });
        } else {
          console.error('Failed to join channel:', response.message);
          socket.disconnect();
        }
      },
    );
  } catch (error) {
    console.error('Error during test:', error);
  }
}

socket.on('connect', () => {
  console.log('Connected to the server:', socket.id);
  runTest();
});

socket.on('channelMessageResponse', response => {
  console.log('Channel message response:', response);
  if (response.success) {
    console.log('Message sent successfully!');
  } else {
    console.error('Error sending message:', response.message);
  }
  setTimeout(() => {
    socket.disconnect();
    process.exit(0);
  }, 1000);
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
