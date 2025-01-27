const mongoose = require('mongoose');
const Channel = require('../models/Channel');
const User = require('../models/User');
const ChannelUser = require('../models/ChannelUser');

// return channel id by channel name
async function getChannelId(channelName) {

  const channel = await Channel.findOne({ name: channelName });

  if (!channel) {
    throw new Error('Channel not found');
  }

  return {
    channel_id: channel._id,
    name: channel.name
  }
}

// return all users' names in a channel
async function getUsersInChannel(channelId) {
    // if (!mongoose.Types.ObjectId.isValid(channelId)) {
    //   throw new Error('Invalid channel ID');
    // }

    const channel = await Channel.findById(channelId).populate('channelUsers');

    return channel.channelUsers.map(channelUser => ({
      user_id: channelUser.user,
      nickname: channelUser.nickname,
    }));
}

// retuns all channels where ther user is present
async function getChannelsOfUser(userID) {
    // if (!mongoose.Types.ObjectId.isValid(userID)) {
    //     throw new Error('Invalid user ID');
    // }

    const channels = await Channel.find({ users: userID}).select('_id name');
    // if (channels.length === 0) {
    //     throw new Error('Channels not found');
    // }
    
    return channels.map(channel => ({
        channel_id: channel._id,
        name: channel.name,
    }));
}

//add user to channel
async function joinChannel(userId, channelName) {
    try {

        const channel = await Channel.findOne({ name: channelName });
        if (!channel) {
            throw new Error('Channel not found');
        }

        const user = await User.findById(userId);
        if (!user) {
          throw new Error('User not found');
        }

        let nickname = user.name;
        let isNicknameTaken = true;

        while (isNicknameTaken) {
          const existingUser = await ChannelUser.findOne({
            channel: channel._id,
            nickname: nickname,
          });

          if (existingUser) {
            nickname = `${user.name}${Math.floor(1000 + Math.random() * 9000)}`;
          } else {
            isNicknameTaken = false;
          }
        }

        const channelUser = new ChannelUser({
          channel: channel._id,
          user: userId,
          nickname: nickname,
        });

        await channelUser.save();

        const updatedChannel = await Channel.findByIdAndUpdate(
          channel._id,
          { $addToSet: { users: userId } },
          { new: true }
        );
  
        if (!updatedChannel) {
          throw new Error('Channel not found');
        }

        const channelUsers = await ChannelUser.find({ channel: channel._id });
  
        const channelWithMappedUsers = {
          channel_id: updatedChannel._id,
          name: updatedChannel.name,
          users: channelUsers.map(channelUser => ({
            user_id: channelUser.user,
            name: channelUser.nickname,
          })),
        };

        return channelWithMappedUsers;
    } catch (err) {
        console.error('Error adding user to channel:', err);
        throw err;
    }
}

// create channel
async function createChannel(userID, name) {
    try {
      const formattedName = name.startsWith('#') ? name : `#${name}`;

      const newChannel = new Channel({ name: formattedName, users: [userID] });
      const savedChannel = await newChannel.save();

      const user = await User.findById(userID);
      if (!user) {
        throw new Error('User not found');
      }

      const channelUser = new ChannelUser({
        channel: savedChannel._id,
        user: userID,
        nickname: user.name,
      });

      await channelUser.save();

      const populatedChannel = await savedChannel.populate('users', 'name');

      const channelWithMappedUsers = {
          channel_id: populatedChannel._id,
          name: populatedChannel.name,
          users: populatedChannel.users.map(user => ({
              user_id: user._id,
              name: user.name,
          })),
      };

      return channelWithMappedUsers;
    } catch (err) {
        console.error('Error creating channel with user:', err);
        throw err;
    }
}  

// quit channel
async function quitChannel(userId, channelId) {
    try {
        const channel = Channel.findById(channelId);
        if (channel.name == "#general") {
          throw new Error('Cannot quit general channel');
        }
        
        const updatedChannel = await Channel.findByIdAndUpdate(
          channelId,
          { $pull: { users: userId } },
          { new: true }
        ); 
    
        if (!updatedChannel) {
          throw new Error('Channel not found');
        }

        const deletedChannelUser = await ChannelUser.findOneAndDelete({
          channel: channelId,
          user: userId,
        });

        if (!deletedChannelUser) {
          throw new Error('User not found in channel');
        }

        const channelUsers = await ChannelUser.find({ channel: channelId });
    
        return {
          channel_id: updatedChannel._id,
          name: updatedChannel.name,
          users: channelUsers.map(channelUser => ({
            user_id: channelUser.user,
            name: channelUser.nickname,
          })),
          deletedUserNickname: deletedChannelUser.nickname,
        };
    } catch (err) {
        console.error('Error removing user from channel:', err);
        throw err;
    }
}

//method to rename a channel
async function renameChannel(channelId, newName) {
    try {
        const channel = await Channel.findById(channelId);
        const oldName = channel.name;
        if(oldName == "#general") {
          throw new Error('Cannot rename general channel');
        }
        const updatedChannel = await Channel.findByIdAndUpdate(
          channelId,
          { name: newName },
          { new: true }
        );
    
        if (!updatedChannel) {
          throw new Error('Channel not found');
        }

        const channelUsers = await ChannelUser.find({ channel: channelId });
    
        return {
          channel_id: updatedChannel._id,
          name: updatedChannel.name,
          old_name: oldName,
          users: channelUsers.map(channelUser => ({
            user_id: channelUsers.user,
            name: channelUsers.nickname,
          })),
        };
    } catch (err) {
        console.error('Error renaming channel:', err);
        throw err;
    }
}

// delete channel
async function deleteChannel(channelId) {
    try {
        const deletedChannel = await Channel.findByIdAndDelete(channelId);
  
        if (!deletedChannel) {
          throw new Error('Channel not found');
        }

        await ChannelUser.deleteMany({ channel: channelId });
  
        return {
          channel_id: deletedChannel._id,
          name: deletedChannel.name,
        };
    } catch (err) {
        console.error('Error deleting channel:', err);
        throw err;
    }
}

//list al channels. if string is specified, return channels with this string included (case-insesnsitive)
async function getChannels(searchString = '') {
    try {
        let query = {};
  
        if (searchString) {
          query.name = { $regex: searchString, $options: 'i' };
        }
  
        const channels = await Channel.find(query);
  
        return channels.map(channel => ({
          channel_id: channel._id,
          name: channel.name,
        }));
    } catch (err) {
        console.error('Error fetching channels:', err);
        throw err;
    }
}

module.exports = {
    getChannelId,
    getUsersInChannel,
    getChannelsOfUser,
    joinChannel,
    createChannel,
    quitChannel,
    renameChannel,
    deleteChannel,
    getChannels,
};