// server.js
const http = require('http');
const app = require('./app');

require('../models/User.js');
require('../models/Channel.js');
require('../models/Message.js');

const { Server } = require('socket.io');
const channelSocket = require('../sockets/channelSocket');
const userSocket = require('../sockets/userSocket');
const messageSocket = require('../sockets/messageSocket');

// Création du serveur HTTP
const server = http.createServer(app);

// Configuration de Socket.IO
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['*'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Gestion des connexions Socket.IO
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // -- Ajout d'un événement "testRoom" pour test minimal --
  //   Permet de vérifier vite fait qu'on peut avoir 2 sockets dans la même room.
  socket.on('testRoom', (roomName) => {
    console.log(`Socket ${socket.id} is joining room "${roomName}"`);
    socket.join(roomName);

    // Vérifier qui est dans la room après le join
    const members = io.sockets.adapter.rooms.get(roomName);
    console.log(`Members in room "${roomName}":`, members);

    // Broadcast aux autres de la room
    socket.to(roomName).emit('userJoinedTestRoom', {
      socketId: socket.id,
      roomName
    });
  });

  // Handlers spécifiques à ton application
  channelSocket(socket, io);
  userSocket(socket, io);
  messageSocket(socket, io);

  socket.on('disconnect', () => {
    if (socket.userName) {
      activeUsers.delete(socket.userName);

      console.log('A user disconnected:', socket.id);
    }
  });
});

// Configuration du port et lancement du serveur
const normalizePort = (val) => {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
};

const port = normalizePort(process.env.PORT || '3001');
app.set('port', port);

const errorHandler = (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }
  const address = server.address();
  const bind = typeof address === 'string' ? 'pipe ' + address : 'port: ' + port;
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges.');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use.');
      process.exit(1);
      break;
    default:
      throw error;
  }
};

server.on('error', errorHandler);
server.on('listening', () => {
  const address = server.address();
  const bind = typeof address === 'string' ? 'pipe ' + address : 'port ' + port;
  console.log('Listening on ' + bind);
});

server.listen(port);
