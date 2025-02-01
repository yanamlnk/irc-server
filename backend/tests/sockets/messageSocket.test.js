const { createServer } = require('http');
const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const messageSocket = require('../../sockets/messageSocket');
const Message = require('../../models/Message');
const Channel = require('../../models/Channel');
const User = require('../../models/User');

describe('Socket.io Message Tests', () => {
  let ioServer, clientSocket, serverSocket, mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    const httpServer = createServer();
    ioServer = new Server(httpServer);

    await new Promise(resolve => {
      httpServer.listen(() => {
        const { port } = httpServer.address();
        clientSocket = Client(`http://localhost:${port}`);
        resolve();
      });
    });

    await new Promise(resolve => {
      ioServer.on('connection', socket => {
        serverSocket = socket;
        messageSocket(socket, ioServer);
        resolve();
      });
      clientSocket.connect();
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    await new Promise(resolve => {
      ioServer.close(() => {
        clientSocket.close();
        resolve();
      });
    });
  });

  afterEach(async () => {
    await Message.deleteMany({});
    await Channel.deleteMany({});
    await User.deleteMany({});
    jest.clearAllMocks();
  });

  it('should get channel messages', async () => {
    const channel = await Channel.create({ name: 'testChannel' });
    await Message.create({
      text: 'Test message',
      sender: 'testUser',
      channelId: channel._id,
      recipientType: 'Channel',
    });

    return new Promise(resolve => {
      clientSocket.emit('getChannelMessages', { channelId: channel._id.toString() }, response => {
        expect(response.success).toBe(true);
        expect(response.messages).toHaveLength(1);
        expect(response.messages[0].text).toBe('Test message');
        resolve();
      });
    });
  }, 10000);

  it('should send message to channel', async () => {
    const channel = await Channel.create({ name: 'testChannel' });
    serverSocket.join(channel._id.toString());

    const messageData = {
      text: 'Hello channel',
      channelId: channel._id.toString(),
      senderMessage: 'testUser',
    };

    return new Promise(resolve => {
      clientSocket.emit('channelMessage', messageData, async response => {
        expect(response.success).toBe(true);
        expect(response.message.text).toBe('Hello channel');

        const savedMessage = await Message.findOne({ channelId: channel._id });
        expect(savedMessage.text).toBe('Hello channel');
        resolve();
      });
    });
  }, 10000);

  it('should fail to send message when user is not in channel', async () => {
    const channel = await Channel.create({ name: 'testChannel' });

    const messageData = {
      text: 'Hello channel',
      channelId: channel._id.toString(),
      senderMessage: 'testUser',
    };

    return new Promise(resolve => {
      clientSocket.emit('channelMessage', messageData, response => {
        expect(response.success).toBe(false);
        expect(response.message).toBe('Sender must be a member of the channel');
        resolve();
      });
    });
  }, 10000);

  it('should send private message between users in same channel', async () => {
    const channel = await Channel.create({ name: 'testChannel' });

    const recipientServer = new Server();
    let recipientSocket;

    await new Promise(resolve => {
      recipientServer.on('connection', socket => {
        recipientSocket = socket;
        recipientSocket.userName = 'recipient';
        resolve();
      });

      const recipientClient = Client(`http://localhost:${ioServer.httpServer.address().port}`);
      recipientClient.connect();
    });

    serverSocket.userName = 'testUser';

    const channelRoom = new Set([serverSocket.id, recipientSocket.id]);
    ioServer.sockets.adapter.rooms.set(channel._id.toString(), channelRoom);

    // Registrar os sockets no mapa de sockets
    ioServer.sockets.sockets.set(serverSocket.id, serverSocket);
    ioServer.sockets.sockets.set(recipientSocket.id, recipientSocket);

    // Logs para debug
    console.log('Channel Room:', channel._id.toString());
    console.log('Room members:', Array.from(channelRoom));
    console.log('Socket IDs:', {
      sender: serverSocket.id,
      recipient: recipientSocket.id,
    });
    console.log('Sockets in io:', Array.from(ioServer.sockets.sockets.keys()));
    console.log('UserNames:', {
      sender: serverSocket.userName,
      recipient: recipientSocket.userName,
    });

    const messageData = {
      text: 'Private hello',
      recipientName: 'recipient',
      channelId: channel._id.toString(),
      senderMessage: 'testUser',
    };

    return new Promise((resolve, reject) => {
      // Ouvir por mensagens privadas no socket do destinatário
      recipientSocket.on('newPrivateMessage', message => {
        try {
          expect(message.text).toBe('Private hello');
          expect(message.isSent).toBe(true);
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      // Enviar mensagem privada
      clientSocket.emit('privateMessage', messageData, response => {
        try {
          expect(response.success).toBe(true);
          expect(response.message.text).toBe('Private hello');
        } catch (error) {
          reject(error);
        }
      });

      // Timeout de segurança
      setTimeout(() => {
        reject(new Error('Test timed out waiting for private message'));
      }, 5000);
    });
  }, 15000);

  it('should fail to send message without sender name', async () => {
    const channel = await Channel.create({ name: 'testChannel' });

    const messageData = {
      text: 'Hello channel',
      channelId: channel._id.toString(),
      senderMessage: null,
    };

    return new Promise(resolve => {
      clientSocket.emit('channelMessage', messageData, response => {
        expect(response.success).toBe(false);
        expect(response.message).toBe('Choose a name before sending a message');
        resolve();
      });
    });
  }, 10000);
});
