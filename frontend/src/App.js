import React, { useState, useEffect, useRef } from 'react';
import socket from './socket';
import UsernameForm from './components/UsernameForm';
import Sidebar from './components/Sidebar';
import MainSection from './components/MainSection';
import UserList from './components/UserList';
import { UserExists, setNickname, listChannels } from './utils';
import './App.css';

const App = () => {
  const [currentUser, setCurrentUser] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [view, setView] = useState('channels');
  const [selectedChannel, setSelectedChannel] = useState('#general');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [channels, setChannels] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isUsernameSet) {
      socket.emit('authenticate', { userId: currentUser.id });
      listChannelsOfUser(currentUser.id);
    }
  }, [isUsernameSet]);

  useEffect(() => {
    if (channels.length > 0) {
      listUsersInChannel();
      const currentChannelId = channels.find(
        channel => channel.name === selectedChannel,
      )?.channel_id;
      if (currentChannelId) {
        socket.emit('getNickname', { userId: currentUser.id, channelId: currentChannelId }, (response) => {
          if (response.success) {
            setCurrentUser({ ...currentUser, name: response.nickname });
          } else {
            setErrorMessage(response.message);
          }
        });

        socket.emit('getChannelMessages', { channelId: currentChannelId }, (response) => {
          if (response.success) {
            setMessages(response.messages.map((msg) => ({
              user: msg.sender,
              text: msg.text,
              channel: selectedChannel,
            })));
          } else {
            setErrorMessage(response.message);
          }
        });
      }
    }

    socket.on('userLeftChannel', ({ userId, channelId, userName }) => {
      setMessages(prevMessages => [
        ...prevMessages,
        { user: "Bot", text: `${userName} a quitté le salon`, channel: selectedChannel },
      ]);
      listUsersInChannel();
    });

    return () => {
      socket.off('userLeftChannel');
    };
  }, [selectedChannel, channels]);

  useEffect(() => {
    socket.on('userJoinedChannel', ({ userId, channelId, channelName, userName }) => {
      setMessages(prevMessages => [
        ...prevMessages,
        { user: 'Bot', text: `${userName} a rejoint le salon`, channel: channelName },
      ]);
      listUsersInChannel();
    });

    socket.on('channelRenamed', ({ channel }) => {
      setChannels(prevChannels =>
        prevChannels.map(ch =>
          ch.channel_id === channel.channel_id ? { ...ch, name: channel.name } : ch,
        ),
      );
    });

    socket.on('userChangedName', ({ userId, channelId, newName }) => {
      listUsersInChannel();
    });

    socket.on('channelDeleted', ({ channel }) => {
      alert("Attention ! Le salon a été supprimé, vous avez été redirigé vers le salon général");
      if (selectedChannel === channel.name) {
        setSelectedChannel("#general");
      }
      setChannels(channels.filter((ch) => ch.channel_id !== channel.channel_id));
      setMessages(messages.filter((msg) => msg.channel !== channel.name));
      listChannelsOfUser(currentUser.id);
    });

    socket.on('newMessage', (newMsg) => {
      const findChannel = channels.find(channel => channel.channel_id === newMsg.channelId);
      setMessages(prevMessages => [
        ...prevMessages,
        { user: newMsg.sender, text: newMsg.text, channel: findChannel.name },
      ]);
    });

    socket.on('newPrivateMessage', message => {
      const findChannel = channels.find(channel => channel.channel_id === message.channelId);
      setMessages(prevMessages => [
        ...prevMessages,
        { user: message.sender, text: message.text, channel: findChannel.name, isPrivate: true },
      ]);
    });

    return () => {
      socket.off('userJoinedChannel');
      socket.off('userLeftChannel');
      socket.off('userChangedName');
      socket.off('channelRenamed');
      socket.off('newMessage');
      socket.off('newPrivateMessage');
    };
  }, [selectedChannel, channels]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectionUser = () => {
    joinChannel(currentUser.id, '#general');
  };

  const handleSendMessage = () => {
    if (currentMessage.trim() !== '') {
      setErrorMessage(''); // Réinitialiser le message d'erreur
      if (currentMessage.startsWith('/')) {
        handleCommand(currentMessage);
      } else {
        sendMessage(currentMessage);
      }
      setCurrentMessage('');
    }
  };

  const handleCommand = (command) => {
    const [cmd, ...args] = command.slice(1).split(" ");
    if (!args.length && (cmd !== "users" && cmd !== "list")) { 
      return;
    }
    setErrorMessage(''); // Réinitialiser le message d'erreur
    switch (cmd) {
      case 'nick':
        const currentChannelId = channels.find(
          channel => channel.name === selectedChannel,
        )?.channel_id;
        setNickname(args[0], socket, currentUser, currentChannelId, setUsers, setCurrentUser);
        listChannelsOfUser(currentUser.id);
        break;
      case 'list':
        listChannels(args[0], socket, setMessages, messages, selectedChannel);
        break;
      case 'create':
        createChannel(currentUser.id, args[0]);
        break;
      case "delete":
        deleteChannel(args[0]);
        break;
      case 'join':
        joinChannel(currentUser.id, args[0]);
        break;
      case 'quit':
        quitChannel(currentUser.id, args[0]);
        break;
      case 'users':
        listUsersInChannel(true);
        break;
      case 'msg':
        sendPrivateMessage(args.slice(1).join(' '), args[0]);
        const recipient = args[0];
        const message = args.slice(1).join(' ');
        console.log(`Recipient: ${recipient}, Message: ${message}`);
        break;
      default:
        console.log('Commande inconnue');
    }
  };

  const sendMessage = newMessage => {
    const currentChannelId = channels.find(channel => channel.name === selectedChannel)?.channel_id;
    socket.emit(
      'channelMessage',
      { text: newMessage, channelId: currentChannelId, senderMessage: currentUser.name },
      response => {
        if (response.success) {
          setErrorMessage(''); // Réinitialiser le message d'erreur
          setMessages(prevMessages => [
            ...prevMessages,
            { user: currentUser.name, text: newMessage, channel: selectedChannel },
          ]);
        } else {
          setErrorMessage(response.message);
        }
      },
    );
  };

  const sendPrivateMessage = (message, recipientName) => {
    const currentChannelId = channels.find(channel => channel.name === selectedChannel)?.channel_id;

    if (currentChannelId) {
      socket.emit(
        'privateMessage',
        {
          text: message,
          recipientName: recipientName,
          channelId: currentChannelId,
          senderMessage: currentUser.name,
        },
        response => {
          if (response.success) {
            setErrorMessage(''); // Réinitialiser le message d'erreur
            setMessages(prevMessages => [
              ...prevMessages,
              { user: currentUser.name, text: message, recipient: recipientName, isSent: true },
            ]);
          } else {
            setErrorMessage('Error sending message: ' + response.message);
          }
        },
      );
    }
  };

  const chargeMessages = channelId => {
    socket.emit('getChannelMessages', { channelId }, response => {
      if (response.success) {
        setMessages(response.messages);
      } else {
        setErrorMessage(response.message);
      }
    });
  };

  const handleSetUsername = name => {
    if (!name) {
      name = `User${Math.floor(Math.random() * 1000)}`;
    }

    socket.emit('chooseName', name, response => {
      if (response.success) {
        setCurrentUser({
          id: response.user.id,
          name: response.user.name,
        });
        setIsUsernameSet(true);
      } else {
        setErrorMessage(response.message);
      }
    });
  };

  const listChannelsOfUser = (userId, filter = '') => {
    socket.emit('listChannelsOfUser', userId, response => {
      if (response.success) {
        setChannels(response.channels);
      } else {
        setErrorMessage(response.message);
      }
    });
  };

  const listUsersInChannel = (requestCommand = false) => {
    const channelId = channels.find(channel => channel.name === selectedChannel)?.channel_id;
    if (channelId) {
      socket.emit('listUsersInChannel', channelId, response => {
        if (response.success) {
          if (requestCommand) {
            setMessages(prevMessages => [
              ...prevMessages,
              {
                user: 'Bot',
                text: `Liste des utilisateurs du salon: ${response.users
                  .map(user => user.nickname)
                  .join(', ')}`,
                channel: selectedChannel,
              },
            ]);
          }
          setUsers(response.users);
        } else {
          setErrorMessage(response.message);
        }
      });
    }
  };

  const joinChannel = (userId, channelName) => {
    socket.emit('joinChannel', { userId, channelName }, response => {
      if (response.success) {
        setErrorMessage(''); // Réinitialiser le message d'erreur
        listChannelsOfUser(userId);
        setSelectedChannel(channelName);
      } else {
        setErrorMessage(response.message);
      }
    });
  };

  const createChannel = (userId, name) => {
    socket.emit('createChannel', { userId, name }, response => {
      if (response.success) {
        setErrorMessage(''); // Réinitialiser le message d'erreur
        listChannelsOfUser(userId);
        setSelectedChannel(name);
      } else {
        setErrorMessage(response.message);
      }
    });
  };

  const quitChannel = (userId, channelName) => {
    const channelId = channels.find((channel) => channel.name === channelName)?.channel_id;
    if (!channelId) {
      setErrorMessage("Channel not found");
      return;
    }
    socket.emit("quitChannel", { userId, channelId }, (response) => {
      if (response.success) {
        setErrorMessage(''); // Réinitialiser le message d'erreur
        listChannelsOfUser(userId);
        if (selectedChannel === channelName) {
          setSelectedChannel("#general");
        }
      } else {
        setErrorMessage(response.message);
      }
    });
  };

  const renameChannel = channelId => {
    let newName = prompt('Entrez le nouveau nom du salon');
    if (newName) {
      socket.emit('renameChannel', { channelId, newName }, response => {
        if (response.success) {
          setChannels(
            channels.map(channel =>
              channel.channel_id === channelId ? { ...channel, name: newName } : channel,
            ),
          );
        } else {
          setErrorMessage(response.message);
        }
      });
    }
  };

  const deleteChannel = (channelName) => {
    socket.emit("deleteChannel", channelName, (response) => {
      if (response.success) {
        setChannels(channels.filter((channel) => channel.name !== channelName));
        if (selectedChannel === response.channel.name) {
          alert("Le salon a été supprimé, vous avez été redirigé vers le salon général");
          setSelectedChannel("#general");
        }
        setMessages(messages.filter((message) => message.channel !== response.channel.name));
      } else {
        setErrorMessage(response.message);
      }
    });
  };

  if (!isUsernameSet) {
    return <UsernameForm handleSetUsername={handleSetUsername} />;
  }

  return (
    <div className="app">
      <button className="menu-burger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        ☰
      </button>
      <Sidebar
        view={view}
        setView={setView}
        channels={channels}
        selectedChannel={selectedChannel}
        setSelectedChannel={setSelectedChannel}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        renameChannel={renameChannel}
        deleteChannel={deleteChannel}
        users={users}
      />
      <MainSection
        messages={messages}
        selectedChannel={selectedChannel}
        currentUser={currentUser}
        currentMessage={currentMessage}
        setCurrentMessage={setCurrentMessage}
        handleSendMessage={handleSendMessage}
        messagesEndRef={messagesEndRef}
        errorMessage={errorMessage} // Ajoutez cette ligne
      />
      <UserList users={users} />
    </div>
  );
};

export default App;
