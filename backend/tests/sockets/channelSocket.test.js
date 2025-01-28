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

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    const httpServer = createServer();
    ioServer = new Server(httpServer);
    httpServer.listen(() => {
      const { port } = httpServer.address();
      clientSocket = Client(`http://localhost:${port}`);
    });

    ioServer.on('connection', (socket) => {
      serverSocket = socket;
      channelSocket(socket, ioServer);
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    ioServer.close();
    clientSocket.close();
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

  it('should list all channels of a user', async (done) => {
    const userId = new mongoose.Types.ObjectId();
    const channel = await Channel.create({ name: 'testChannel' });
    await ChannelUser.create({ channel: channel._id, user: userId, nickname: 'testUser' });
  
    clientSocket.emit('listChannelsOfUser', userId.toString(), (response) => {
      expect(response.success).toBe(true);
      expect(response.channels).toHaveLength(1);
      expect(response.channels[0].name).toBe('testChannel');
      done(); // Ensure `done` is called after assertions
    });
  });

  it('should list all users in a channel', async () => {
    const userId = new mongoose.Types.ObjectId();
    const channel = await Channel.create({ name: 'testChannel' });
    await ChannelUser.create({ channel: channel._id, user: userId, nickname: 'testUser' });

    clientSocket.emit('listUsersInChannel', channel._id.toString(), (response) => {
      expect(response.success).toBe(true);
      expect(response.users).toHaveLength(1);
      expect(response.users[0].nickname).toBe('testUser');
    });
  });

  it('should allow a user to join a channel', async () => {
    const user = await User.create({ name: 'Test'});
    const channel = await Channel.create({ name: 'testChannel' });

    clientSocket.emit('joinChannel', { userId: user._id.toString(), channelName: 'testChannel' }, (response) => {
      expect(response.success).toBe(true);
      expect(response.channel.name).toBe('testChannel');
      ioServer.of('/').adapter.rooms.get(channel._id.toString()).has(serverSocket.id);
    });
  });

  it('should allow a user to quit a channel', async () => {
    const user = await User.create({ name: 'Test'});
    const channel = await Channel.create({ name: 'testChannel' });
    const joinedChannel = await channelService.joinChannel(user._id, channel.name);

    clientSocket.emit('quitChannel', { userId: user._id.toString(), channelId: channel._id.toString() }, (response) => {
      expect(response.success).toBe(true);
      expect(response.channel).toBeTruthy();
    });
  });

  it('should rename a channel', async (done) => {
    const channel = await Channel.create({ name: 'testChannel' });
  
    clientSocket.emit('renameChannel', { channelId: channel._id.toString(), newName: 'renamedChannel' }, (response) => {
      expect(response.success).toBe(true);
      expect(response.channel.name).toBe('renamedChannel');
      done();
    });
  });

  it('should delete a channel', async () => {
    const channel = await Channel.create({ name: 'testChannel' });

    clientSocket.emit('deleteChannel', 'testChannel', (response) => {
      expect(response.success).toBe(true);
      expect(response.channel.name).toBe('testChannel');
    });
  });

  it('should list all channels matching a search string', async () => {
    await Channel.create({ name: 'channelOne' });
    await Channel.create({ name: 'channelTwo' });

    clientSocket.emit('listChannels', 'channel', (response) => {
      expect(response.success).toBe(true);
      expect(response.channels).toHaveLength(2);
    });
  });
});
