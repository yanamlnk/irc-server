const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const userService = require('../../services/userService');
const channelService = require('../../services/channelService');
const User = require('../../models/User');
const Channel = require('../../models/Channel');
const ChannelUser = require('../../models/ChannelUser');

describe('User Service Test', () => {
    let mongoServer;
    let channel;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        channel = new Channel({ name: '#general' });
        await channel.save();
    });

    afterEach(async () => {
        await User.deleteMany({});
        await Channel.deleteMany({});
        await ChannelUser.deleteMany({});
        jest.restoreAllMocks();
    });

    it('should generate a unique username with 4 digits when the desired name is taken', async () => {
        const firstUser = await userService.createUser('TestUser');
        expect(firstUser.name).toBe('TestUser');
        const secondUser = await userService.createUser('TestUser');
        
        expect(secondUser.name).not.toBe('TestUser');
        expect(secondUser.name).toMatch(/^TestUser\d{4}$/);
        
        const digits = secondUser.name.slice(-4);
        expect(digits).toMatch(/^\d{4}$/);
        expect(parseInt(digits)).toBeGreaterThanOrEqual(1000);
        expect(parseInt(digits)).toBeLessThanOrEqual(9999);
      });

    it('should create a user and add them to the #general channel', async () => {
        const user = await userService.createUser('Steven');
  
        const savedUser = await User.findById(user._id);
        expect(savedUser).not.toBeNull();
        expect(savedUser.name).toBe('Steven');
  
        const channelUser = await ChannelUser.findOne({ user: user._id, channel: channel._id });
        expect(channelUser).not.toBeNull();
    });

    it('should update a users nickname in a channel if the nickname is available', async () => {
        const user = await userService.createUser('Steven');
  
        const updatedUser = await userService.updateUserName(user._id, 'Luiza', channel._id);
        expect(updatedUser.nickname).toBe('Luiza');
  
        const updatedChannelUser = await userService.updateUserName(user._id, 'Steven', channel._id);
  
        expect(updatedChannelUser).not.toBeNull();
        expect(updatedChannelUser.nickname).toBe('Steven');
    });

    it('should retrieve the nickname for a user in a specific channel', async () => {
        const user = new User({ name: 'Luiza' });
        await user.save();
  
        const channelUser = new ChannelUser({
          user: user._id,
          channel: channel._id,
          nickname: 'Steven',
        });
        await channelUser.save();
  
        const nickname = await userService.getNickname(user._id, channel._id);
        expect(nickname).toBe('Steven');
    });

    it('should throw an error if the user is not in the channel', async () => {
        const user = new User({ name: 'Yana' });
        await user.save();
  
        await expect(userService.getNickname(user._id, '67851bfc665bea7c527c7192')).rejects.toThrow(
          'ChannelUser not found'
        );
    });

    it('should throw an error when creating user fails', async () => {
        jest.spyOn(User.prototype, 'save').mockRejectedValueOnce(new Error('Database error'));
        
        await expect(userService.createUser('TestUser'))
          .rejects
          .toThrow('Database error');
    });
      
    it('should throw an error when user is not found in channel during name update', async () => {
        const user = new User({ name: 'TestUser' });
        await user.save();
        
        await expect(userService.updateUserName(user._id, 'NewName', channel._id))
          .rejects
          .toThrow('User not found in channel');
    });
      
    it('should return existing channel user if nickname is unchanged', async () => {
        const user = await userService.createUser('TestUser');
        const channelUser = await ChannelUser.findOne({ 
          user: user._id,
          channel: channel._id 
        });
        
        const result = await userService.updateUserName(user._id, channelUser.nickname, channel._id);
        
        expect(result).toEqual(channelUser);
    });
      
    it('should generate a unique nickname when the desired nickname is taken', async () => {
        const user1 = await userService.createUser('User1');
        
        const user2 = await userService.createUser('User2');
        
        const updatedUser = await userService.updateUserName(user2._id, 'User1', channel._id);
        
        expect(updatedUser.nickname).toMatch(/^User1\d{4}$/);
        expect(updatedUser.nickname).not.toBe('User1');
    });
      
    it('should throw an error when updating username fails', async () => {
        const user = await userService.createUser('TestUser');
        
        jest.spyOn(ChannelUser, 'findOneAndUpdate').mockRejectedValueOnce(new Error('Database error'));
        
        await expect(userService.updateUserName(user._id, 'NewName', channel._id))
          .rejects
          .toThrow('Database error');
      });
});
