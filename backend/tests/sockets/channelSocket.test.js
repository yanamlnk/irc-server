const { createServer } = require('http');
const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const channelSocket = require('../../sockets/channelSocket');
const channelService = require('../../services/channelService');
const Channel = require('../../models/Channel');
const ChannelUser = require('../../models/ChannelUser');
const User = require('../../models/User');

describe('Socket.io Channel Tests', () => {
  let ioServer, clientSocket, serverSocket, mongoServer;
  let testUser;
  let testChannels;

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
          channelSocket(socket, ioServer);
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
    testUser = new User({ name: 'Test User' });
    await testUser.save();

    testChannels = await Promise.all([
      new Channel({ name: 'channel-1', users: [testUser._id] }).save(),
      new Channel({ name: 'channel-2', users: [testUser._id] }).save(),
      new Channel({ name: 'channel-3', users: [testUser._id] }).save()
    ]);

    await Promise.all(testChannels.map(channel => 
      new ChannelUser({
        channel: channel._id,
        user: testUser._id,
        nickname: `Nick-${channel.name}`
      }).save()
    ));
  });

  afterEach(async () => {
    await Channel.deleteMany({});
    await ChannelUser.deleteMany({});
    await User.deleteMany({});
  });

  it('should get a channel ID by name', (done) => {
    Channel.create({ name: 'testChannel' }).then((channel) => {
      clientSocket.emit('getChannelId', 'testChannel', (response) => {
        expect(response.success).toBe(true);
        expect(response.channelId).toBe(channel._id.toString());
        done();
      });
    });
  });

  it('should return error when channel does not exist', (done) => {
    const nonExistentChannel = 'non-existent-channel';
    
    clientSocket.emit('getChannelId', nonExistentChannel, (response) => {
      expect(response.success).toBe(false);
      expect(response.message).toBeTruthy();
      done();
    });
  });

  it('should return all channels for a valid user', (done) => {
    expect(clientSocket.connected).toBe(true);
    
    clientSocket.emit('listChannelsOfUser', testUser._id.toString(), (response) => {
      try {
        expect(response.success).toBe(true);
        expect(Array.isArray(response.channels)).toBe(true);
        expect(response.channels.length).toBe(3);
        
        response.channels.forEach(channel => {
          expect(channel).toHaveProperty('channel_id');
          expect(channel).toHaveProperty('name');
          
          // Verify that one of our test channels matches
          const matchingChannel = testChannels.find(
            tc => tc._id.toString() === channel.channel_id.toString()
          );
          expect(matchingChannel).toBeTruthy();
          expect(channel.name).toBe(matchingChannel.name);
        });

        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it('should return empty array for user with no channels', (done) => {
    const newUser = new User({ name: 'No Channels User' });
    newUser.save().then(() => {
      clientSocket.emit('listChannelsOfUser', newUser._id.toString(), (response) => {
        try {
          expect(response.success).toBe(true);
          expect(Array.isArray(response.channels)).toBe(true);
          expect(response.channels.length).toBe(0);
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  it('should handle invalid user ID', (done) => {
    const invalidUserId = 'invalid-user-id';
    clientSocket.emit('listChannelsOfUser', invalidUserId, (response) => {
      try {
        expect(response.success).toBe(false);
        expect(response.message).toBeTruthy();
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it('should list all users in a channel', (done) => {
    expect(clientSocket.connected).toBe(true);
    
    const channelId = testChannels[0]._id.toString();
    
    clientSocket.emit('listUsersInChannel', channelId, (response) => {
      try {
        expect(response.success).toBe(true);
        expect(Array.isArray(response.users)).toBe(true);
        expect(response.users.length).toBe(1);
        
        const user = response.users[0];
        expect(user).toHaveProperty('user_id');
        expect(user).toHaveProperty('nickname');
        expect(user.user_id.toString()).toBe(testUser._id.toString());
        expect(user.nickname).toBe(`Nick-channel-1`);
        
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it('should handle null channelId', (done) => {
    clientSocket.emit('listUsersInChannel', null, (response) => {
      try {
        expect(response.success).toBe(false);
        expect(response.message).toBe('ChannelId is required');
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it('should handle invalid channel ID format', (done) => {
    const invalidChannelId = 'invalid-id';
    
    clientSocket.emit('listUsersInChannel', invalidChannelId, (response) => {
      try {
        expect(response.success).toBe(false);
        expect(response.message).toBeTruthy();
        done();
      } catch (error) {
        done(error);
      }
    });
  }); 
  
  it('should successfully join a channel', (done) => {
    const channelName = '#testChannel';
    const channel = new Channel({ name: channelName });
    
    channel.save().then(() => {
      clientSocket.emit('joinChannel', {
        channelName: channelName,
        userId: testUser._id.toString()
      }, (response) => {
        expect(response.success).toBe(true);
        expect(response.channel.name).toBe(channelName);
        expect(response.channel.users).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              user_id: testUser._id.toString(),
              name: testUser.name
            })
          ])
        );
        done();
      });
    });
  });

  it('should generate unique nickname when joining channel with taken nickname', (done) => {
    const channelName = '#testChannel';
    const channel = new Channel({ name: channelName });
    const existingUser = new User({ name: testUser.name });
    
    Promise.all([
      channel.save(),
      existingUser.save(),
      new ChannelUser({
        channel: channel._id,
        user: existingUser._id,
        nickname: testUser.name
      }).save()
    ]).then(() => {
      clientSocket.emit('joinChannel', {
        channelName: channelName,
        userId: testUser._id.toString()
      }, (response) => {
        expect(response.success).toBe(true);
        const newUser = response.channel.users.find(u => u.user_id === testUser._id.toString());
        expect(newUser.name).toMatch(/^Test User\d{4}$/);
        done();
      });
    });
  });

  it('should fail when channel does not exist', (done) => {
    clientSocket.emit('joinChannel', {
      channelName: '#nonexistent',
      userId: testUser._id.toString()
    }, (response) => {
      expect(response.success).toBe(false);
      expect(response.message).toBe('Channel not found');
      done();
    });
  });

  it('should fail when user does not exist', (done) => {
    const channelName = '#testChannel';
    const channel = new Channel({ name: channelName });
    
    channel.save().then(() => {
      clientSocket.emit('joinChannel', {
        channelName: channelName,
        userId: new mongoose.Types.ObjectId().toString()
      }, (response) => {
        expect(response.success).toBe(false);
        expect(response.message).toBe('User not found');
        done();
      });
    });
  });




});
