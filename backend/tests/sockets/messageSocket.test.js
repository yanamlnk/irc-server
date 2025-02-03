const { createServer } = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const messageSocket = require('../../sockets/messageSocket');
const Message = require('../../models/Message');
const User = require('../../models/User');
const Channel = require('../../models/Channel');
const ChannelUser = require('../../models/ChannelUser');

jest.mock('../../services/messageService', () => ({
  getChannelMessages: jest.fn(),
  saveMessage: jest.fn(),
  createPrivateMessage: jest.fn()
}));

describe('Socket.io Message Tests', () => {
  jest.setTimeout(10000);
  let ioServer, clientSocket, serverSocket, mongoServer, httpServer;
  let testChannel;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    httpServer = createServer();
    ioServer = new Server(httpServer);

    return new Promise((resolve) => {
      httpServer.listen(() => {
        const port = httpServer.address().port;
        
        ioServer.on('connection', (socket) => {
          serverSocket = socket;
          messageSocket(socket, ioServer);
        });

        clientSocket = new Client(`http://localhost:${port}`);
        clientSocket.on('connect', resolve);
      });
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
    if (ioServer) {
      ioServer.close();
    }
  });

  beforeEach(async () => {
    testChannel = await new Channel({ name: 'test-channel-' + Date.now() }).save();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await Channel.deleteMany({});
    await Message.deleteMany({});
    await User.deleteMany({});
    jest.restoreAllMocks();
  });

  it('should fetch channel messages successfully', (done) => {
    const mockMessages = [
      { 
        _id: 'msg1', 
        text: 'Hello', 
        sender: 'user1', 
        channelId: testChannel._id.toString()
      }
    ];

    const messageService = require('../../services/messageService');
    messageService.getChannelMessages.mockResolvedValueOnce(mockMessages);

    clientSocket.emit('getChannelMessages', { channelId: testChannel._id }, (response) => {
      expect(response.success).toBe(true);
      expect(response.messages).toEqual(mockMessages);
      done();
    });
  });

  it('should handle error when fetching channel messages', (done) => {
    const messageService = require('../../services/messageService');
    messageService.getChannelMessages.mockRejectedValueOnce(new Error('Database error'));

    clientSocket.emit('getChannelMessages', { channelId: testChannel._id }, (response) => {
      expect(response.success).toBe(false);
      expect(response.message).toBe('Database error');
      done();
    });
  });

  it('should save and broadcast channel message', (done) => {
    const mockMessage = {
      _id: 'msg1',
      text: 'Hello channel',
      sender: 'user1',
      channelId: testChannel._id.toString()
    };

    const messageService = require('../../services/messageService');
    messageService.saveMessage.mockResolvedValueOnce({
      ...mockMessage,
      toObject: () => mockMessage
    });

    serverSocket.join(testChannel._id.toString());

    clientSocket.emit('channelMessage', {
      text: 'Hello channel',
      channelId: testChannel._id,
      senderMessage: 'user1'
    }, (response) => {
      expect(response.success).toBe(true);
      expect(response.message).toEqual(mockMessage);
      done();
    });
  });

  it('should reject message when sender name not provided', (done) => {
    clientSocket.emit('channelMessage', {
      text: 'Hello channel',
      channelId: testChannel._id,
      senderMessage: null
    }, (response) => {
      expect(response.success).toBe(false);
      expect(response.message).toBe('Choose a name before sending a message');
      done();
    });
  });

  it('should reject channel message when sender not in channel', (done) => {
    const invalidChannelId = new mongoose.Types.ObjectId().toString();
    
    clientSocket.emit('channelMessage', {
      text: 'Hello channel',
      channelId: invalidChannelId,
      senderMessage: 'user1'
    }, (response) => {
      expect(response.success).toBe(false);
      expect(response.message).toBe('Sender must be a member of the channel');
      done();
    });
  });

  it('should reject private message when recipient not online', async () => {
    const mockUser = await new User({ name: 'globalUser2' }).save();
    
    await new ChannelUser({ 
      channel: testChannel._id,
      user: mockUser._id,
      nickname: 'user2'
    }).save();
  
    serverSocket.join(testChannel._id.toString());
    
    return new Promise((resolve) => {
      clientSocket.emit('privateMessage', {
        text: 'Hello private',
        recipientName: 'user2',
        channelId: testChannel._id,
        senderMessage: 'user1'
      }, (response) => {
        expect(response.success).toBe(false);
        expect(response.message).toBe('Recipient is not online');
        resolve();
      });
    });
  });

  it('should reject private message when users not in same channel', async () => {
    const mockUser = await new User({ name: 'globalUser2' }).save();
    
    await new ChannelUser({ 
      channel: testChannel._id,
      user: mockUser._id,
      nickname: 'user2'
    }).save();
  
    const recipientSocketId = 'recipient-socket-id';
    const mockRecipientSocket = {
      id: recipientSocketId,
      userName: 'globalUser2' 
    };
    ioServer.sockets.sockets.set(recipientSocketId, mockRecipientSocket);
  
    const room = new Set([recipientSocketId]);
    ioServer.sockets.adapter.rooms.set(testChannel._id.toString(), room);
  
    return new Promise((resolve) => {
      clientSocket.emit('privateMessage', {
        text: 'Hello private',
        recipientName: 'user2',
        channelId: testChannel._id,
        senderMessage: 'user1'
      }, (response) => {
        expect(response.success).toBe(false);
        expect(response.message).toBe('Both users must be in the channel to exchange private messages');
        
        ioServer.sockets.sockets.delete(recipientSocketId);
        resolve();
      });
    });
  });

  it('should reject private message when sender name not provided', (done) => {
    clientSocket.emit('privateMessage', {
      text: 'Hello private',
      recipientName: 'user2',
      channelId: testChannel._id,
      senderMessage: null
    }, (response) => {
      expect(response.success).toBe(false);
      expect(response.message).toBe('You must choose a name');
      done();
    });
  });

  it('should reject private message when text or recipient is missing', (done) => {
    clientSocket.emit('privateMessage', {
      text: '',  // Empty text
      recipientName: '',  // Empty recipient
      channelId: testChannel._id,
      senderMessage: 'user1'
    }, (response) => {
      expect(response.success).toBe(false);
      expect(response.message).toBe('Message and recipient are required');
      done();
    });
  });

  it('should successfully send private message', async () => {
    const mockUser = await new User({ name: 'globalUser2' }).save();
    
    await new ChannelUser({ 
      channel: testChannel._id,
      user: mockUser._id,
      nickname: 'user2'
    }).save();
  
    const recipientSocketId = 'recipient-socket-id';
    const mockRecipientSocket = {
      id: recipientSocketId,
      userName: 'globalUser2'  
    };
    ioServer.sockets.sockets.set(recipientSocketId, mockRecipientSocket);
  
    serverSocket.join(testChannel._id.toString());
    const room = new Set([recipientSocketId, serverSocket.id]);
    ioServer.sockets.adapter.rooms.set(testChannel._id.toString(), room);
  
    const mockMessage = {
      text: 'Hello private',
      sender: 'user1',
      recipientName: 'user2',
      channelId: testChannel._id.toString()
    };
  
    const messageService = require('../../services/messageService');
    messageService.createPrivateMessage.mockReturnValueOnce(mockMessage);
  
    return new Promise((resolve) => {
      clientSocket.emit('privateMessage', {
        text: 'Hello private',
        recipientName: 'user2',
        channelId: testChannel._id,
        senderMessage: 'user1'
      }, (response) => {
        expect(response.success).toBe(true);
        expect(response.message).toEqual(mockMessage);
        
        ioServer.sockets.sockets.delete(recipientSocketId);
        resolve();
      });
    });
  });

  it('should reject private message when recipient is not found in channel', async () => {
    const mockUser = await new User({ name: 'globalUser2' }).save();
    
    const recipientSocketId = 'recipient-socket-id';
    const mockRecipientSocket = {
      id: recipientSocketId,
      userName: 'globalUser2'
    };
    ioServer.sockets.sockets.set(recipientSocketId, mockRecipientSocket);
  
    return new Promise((resolve) => {
      clientSocket.emit('privateMessage', {
        text: 'Hello private',
        recipientName: 'user2', 
        channelId: testChannel._id,
        senderMessage: 'user1'
      }, (response) => {
        expect(response.success).toBe(false);
        expect(response.message).toBe('Recipient not found in channel');
        
        ioServer.sockets.sockets.delete(recipientSocketId);
        resolve();
      });
    });
  });
});