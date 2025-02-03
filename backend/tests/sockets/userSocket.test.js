const { createServer } = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const userSocket = require('../../sockets/userSocket');
const User = require('../../models/User');
const Channel = require('../../models/Channel');
const ChannelUser = require('../../models/ChannelUser');

jest.mock('../../services/userService', () => {
    const originalModule = jest.requireActual('../../services/userService');
    return originalModule;
});

describe('Socket.io User Tests', () => {
  let ioServer, clientSocket, serverSocket, mongoServer;
  let generalChannel;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    const httpServer = createServer();
    ioServer = new Server(httpServer);

    return new Promise((resolve) => {
      httpServer.listen(() => {
        const port = httpServer.address().port;
        ioServer.on('connection', (socket) => {
          serverSocket = socket;
          userSocket(socket, ioServer);
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
    generalChannel = await new Channel({ name: '#general' }).save();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await Channel.deleteMany({});
    await ChannelUser.deleteMany({});
    await User.deleteMany({});
    jest.restoreAllMocks();
  });

  it('should successfully create a new user with unique name', (done) => {
    clientSocket.emit('chooseName', 'testUser', (response) => {
      expect(response.success).toBe(true);
      expect(response.user.name).toBe('testUser');
      expect(response.user.id).toBeDefined();
      done();
    });
  });

  it('should generate unique name when duplicate exists', async () => {
    const firstResponse = await new Promise((resolve) => {
      clientSocket.emit('chooseName', 'testUser', resolve);
    });

    const secondResponse = await new Promise((resolve) => {
      clientSocket.emit('chooseName', 'testUser', resolve);
    });

    expect(firstResponse.success).toBe(true);
    expect(secondResponse.success).toBe(true);
    expect(secondResponse.user.name).not.toBe(firstResponse.user.name);
    expect(secondResponse.user.name).toMatch(/testUser\d{4}/);
  });

  it('should emit userJoinedChannel event to all users in channel', (done) => {
    const secondClientSocket = new Client(`http://localhost:${clientSocket.io.engine.port}`);

    secondClientSocket.on('connect', () => {
      secondClientSocket.emit('chooseName', 'user1', (firstResponse) => {
        expect(firstResponse.success).toBe(true);
        
        secondClientSocket.once('userJoinedChannel', (data) => {
          expect(data.userName).toBe('testUser');
          expect(data.channelName).toBe('#general');
          secondClientSocket.disconnect();
          done();
        });

        clientSocket.emit('chooseName', 'testUser', (secondResponse) => {
          expect(secondResponse.success).toBe(true);
        });
      });
    });
  }, 10000);

  it('should successfully update nickname', (done) => {
    let userId;
    
    clientSocket.emit('chooseName', 'initialName', async (response) => {
      userId = response.user.id;
      
      clientSocket.emit(
        'changeName',
        { userId, newName: 'newNickname', channelId: generalChannel._id },
        (changeResponse) => {
          expect(changeResponse.success).toBe(true);
          expect(changeResponse.newName).toBe('newNickname');
          done();
        }
      );
    });
  });

  it('should generate unique nickname when duplicate exists', async () => {
    const createResponse = await new Promise((resolve) => {
      clientSocket.emit('chooseName', 'initialName', resolve);
    });
    const userId = createResponse.user.id;

    const existingUser = await new User({ name: 'existingUser' }).save();
    await ChannelUser.create({
      channel: generalChannel._id,
      user: existingUser._id,
      nickname: 'targetNick'
    });

    const response = await new Promise((resolve) => {
      clientSocket.emit(
        'changeName',
        { userId, newName: 'targetNick', channelId: generalChannel._id },
        resolve
      );
    });

    expect(response.success).toBe(true);
    expect(response.newName).toMatch(/targetNick\d{4}/);
  });

  it('should emit userChangedName event to other users', (done) => {
    const secondClientSocket = new Client(`http://localhost:${clientSocket.io.engine.port}`);
    
    secondClientSocket.on('connect', () => {
      clientSocket.emit('chooseName', 'firstUser', (firstUserResponse) => {
        const userId = firstUserResponse.user.id;
        
        secondClientSocket.emit('chooseName', 'secondUser', () => {
          secondClientSocket.on('userChangedName', (data) => {
            expect(data.userId.toString()).toBe(userId.toString());
            expect(data.newName).toBe('newNickname');
            expect(data.channelId.toString()).toBe(generalChannel._id.toString());
            secondClientSocket.disconnect();
            done();
          });

          clientSocket.emit(
            'changeName',
            { userId, newName: 'newNickname', channelId: generalChannel._id },
            () => {}
          );
        });
      });
    });
  }, 10000);

  it('should handle error when user not found in channel', (done) => {
    const nonexistentUserId = new mongoose.Types.ObjectId();
    clientSocket.emit(
      'changeName',
      { 
        userId: nonexistentUserId, 
        newName: 'newName', 
        channelId: generalChannel._id 
      },
      (response) => {
        expect(response.success).toBe(false);
        expect(response.message).toBe('User not found in channel');
        done();
      }
    );
  });

  it('should successfully retrieve nickname', async () => {
    const createResponse = await new Promise((resolve) => {
      clientSocket.emit('chooseName', 'testUser', resolve);
    });
    
    const userId = createResponse.user.id;
    const channelId = generalChannel._id;

    const nicknameResponse = await new Promise((resolve) => {
      clientSocket.emit('getNickname', { userId, channelId }, resolve);
    });

    expect(nicknameResponse.success).toBe(true);
    expect(nicknameResponse.nickname).toBe('testUser');
  });

  it('should handle error when channelUser not found for getNickname', (done) => {
    const nonexistentUserId = new mongoose.Types.ObjectId();
    clientSocket.emit(
      'getNickname',
      { 
        userId: nonexistentUserId, 
        channelId: generalChannel._id 
      },
      (response) => {
        expect(response.success).toBe(false);
        expect(response.message).toBe('ChannelUser not found');
        done();
      }
    );
  });

  it('should handle error when creating user', (done) => {
    const mockError = new Error('Failed to create user');
    jest.spyOn(User, 'findOne').mockRejectedValueOnce(mockError);
    
    clientSocket.emit('chooseName', 'testUser', (response) => {
      try {
        expect(response.success).toBe(false);
        expect(response.message).toBe('Failed to create user');
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});