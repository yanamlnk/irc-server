const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const channelService = require('../../services/channelService');
const Channel = require('../../models/Channel');
const User = require('../../models/User');

describe('Channel Service Test', () => {
    let mongoServer;

    beforeAll(async() => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        await Channel.deleteMany({});
        await User.deleteMany({});
    });

    // for getUsersInChannel
    it('should return users in a channel', async () => {
        const user = new User({ name: 'Test User' });
        await user.save();
      
        const channel = new Channel({ name: '#test-channel', users: [user._id] });
        await channel.save();
      
        const result = await channelService.getUsersInChannel(channel._id.toString());
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Test User');
    });

    // for error in getUsersInChannel
    it('should throw an error for invalid channel ID in getUsersInChannel', async () => {
        await expect(channelService.getUsersInChannel('invalidChannelId')).rejects.toThrow('Invalid channel ID');
    });

    // for getChannelsOfUser
    it('should return channels of a user', async () => {
        const user = new User({ name: 'Test User' });
        await user.save();
      
        const channel1 = new Channel({ name: '#channel1', users: [user._id] });
        const channel2 = new Channel({ name: '#channel2', users: [user._id] });
        await channel1.save();
        await channel2.save();
      
        const result = await channelService.getChannelsOfUser(user._id.toString());
        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('#channel1');
        expect(result[1].name).toBe('#channel2');
    });

    //for error of getChannelsOfUser
    it('should throw an error for invalid user ID in getChannelsOfUser', async () => {
        await expect(channelService.getChannelsOfUser('invalidUserId')).rejects.toThrow('Invalid user ID');
    });

    //for joinChannel
    it('should add a user to a channel', async () => {
        const user = new User({ name: 'Test User' });
        await user.save();
      
        const channel = new Channel({ name: '#test-channel', users: [] });
        await channel.save();
      
        const result = await channelService.joinChannel(user._id.toString(), '#test-channel');
        expect(result.users).toHaveLength(1);
        expect(result.users[0].name).toBe('Test User');
    });

    // errors for joinChannel
    it('should throw an error if channel is not found in joinChannel', async () => {
        const user = new User({ name: 'Test User' });
        await user.save();
      
        await expect(channelService.joinChannel(user._id.toString(), '#non-existent-channel')).rejects.toThrow('Channel not found');
    });
      
    it('should throw an error if user tries to join non-existend channel', async () => {
        const user = new User({ name: 'Test User' });
        await user.save();
      
        await expect(channelService.joinChannel(user._id.toString(), '#non-existent-channel')).rejects.toThrow('Channel not found');
    });
      
    // for createChannel
    it('should create a new channel and add a user', async () => {
        const user = new User({ name: 'Test User' });
        await user.save();
      
        const result = await channelService.createChannel(user._id.toString(), 'new-channel');
        expect(result).toHaveProperty('name', '#new-channel');
        expect(result.users).toHaveLength(1);
        expect(result.users[0].name).toBe('Test User');
    });

    it('should not format the channel name with # if it starts with #', async () => {
        const user = new User({ name: 'Test User' });
        await user.save();
      
        const result = await channelService.createChannel(user._id.toString(), '#new-channel');
        expect(result.name).toBe('#new-channel');
    });

    //errors for createChannel
    it('should throw an error when joinChannel fails in createChannel', async () => {
        const user = new User({ name: 'Test User' });
        await user.save();
      
        jest.spyOn(channelService, 'joinChannel').mockRejectedValueOnce(new Error('Join failed'));
      
        try {
            await channelService.createChannel(user._id.toString(), 'test-channel');
        } catch (err) {
            expect(err.message).toBe('Failed to join channel: Join failed');
        }
    });

    it('should throw an error when saving the channel fails', async () => {
        const user = new User({ name: 'Test User' });
        await user.save();
      
        // Mock newChannel.save() to throw an error
        jest.spyOn(Channel.prototype, 'save').mockRejectedValueOnce(new Error('Save failed'));
      
        await expect(channelService.createChannel(user._id.toString(), 'test-channel')).rejects.toThrow('Save failed');
    });

    // for quitChannel
    it('should remove a user from a channel', async () => {
        const user = new User({ name: 'Test User' });
        await user.save();
      
        const channel = new Channel({ name: '#test-channel', users: [user._id] });
        await channel.save();
      
        const result = await channelService.quitChannel(user._id.toString(), channel._id.toString());
        expect(result.users).toHaveLength(0);
    });
      
    //test for error in quitChannel
    it('should throw an error if channel is not found in quitChannel', async () => {
        const user = new User({ name: 'Test User' });
        await user.save();
      
        const nonExistentChannelId = '67851bfc665bea7c527c7192';
        await expect(channelService.quitChannel(user._id.toString(), nonExistentChannelId)).rejects.toThrow('Channel not found');
    });

    // for renameChannel
    it('should rename a channel', async () => {
        const channel = new Channel({ name: '#old-name', users: [] });
        await channel.save();
      
        const result = await channelService.renameChannel(channel._id.toString(), '#new-name');
        expect(result.name).toBe('#new-name');
    });

    // error for renameChannel
    it('should throw an error if channel is not found in renameChannel', async () => {
        const nonExistentChannelId = '67851bfc665bea7c527c7192';
        await expect(channelService.renameChannel(nonExistentChannelId, '#new-name')).rejects.toThrow('Channel not found');
    });

    // for deleteChannel
    it('should delete a channel', async () => {
        const channel = new Channel({ name: '#channel-to-delete', users: [] });
        await channel.save();
      
        const result = await channelService.deleteChannel(channel._id.toString());
        expect(result.name).toBe('#channel-to-delete');
      
        const deletedChannel = await Channel.findById(channel._id);
        expect(deletedChannel).toBeNull();
    });

    //error for deleteChannel
    it('should throw an error if channel is not found in deleteChannel', async () => {
        const nonExistentChannelId = '67851bfc665bea7c527c7192';
        await expect(channelService.deleteChannel(nonExistentChannelId)).rejects.toThrow('Channel not found');
    });

    //for getChannels normal
    it('should return all channels', async () => {
        const channel1 = new Channel({ name: '#channel1', users: [] });
        const channel2 = new Channel({ name: '#channel2', users: [] });
        await channel1.save();
        await channel2.save();
      
        const result = await channelService.getChannels();
        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('#channel1');
        expect(result[1].name).toBe('#channel2');
      });
    
    // for getChannels with search string  
    it('should return channels based on search string', async () => {
        const channel1 = new Channel({ name: '#channel1', users: [] });
        const channel2 = new Channel({ name: '#another-channel', users: [] });
        await channel1.save();
        await channel2.save();
      
        const result = await channelService.getChannels('another');
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('#another-channel');
    });

    //errors for getChannels
    it('should throw an error if there is a problem fetching channels in getChannels', async () => {
        jest.spyOn(Channel, 'find').mockImplementationOnce(() => { throw new Error('Database error'); });
      
        await expect(channelService.getChannels()).rejects.toThrow('Database error');
    });
      
    it('should return channels based on a search string in getChannels', async () => {
        const channel1 = new Channel({ name: '#channel1', users: [] });
        const channel2 = new Channel({ name: '#another-channel', users: [] });
        await channel1.save();
        await channel2.save();
      
        const result = await channelService.getChannels('another');
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('#another-channel');
    });

});