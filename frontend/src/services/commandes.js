const executeCommand = (command, args, context) => {
    const actions = {
      nick: () => {
        const [nickname] = args;
        console.log(`Surnom défini: ${nickname}`);
        context.setNickname(nickname);
      },
      list: () => {
        const [filter] = args;
        console.log(`Liste des canaux${filter ? ` avec filtre: ${filter}` : ""}`);
        context.listChannels(filter);
      },
      create: () => {
        const [channel] = args;
        console.log(`Canal créé: ${channel}`);
        context.createChannel(channel);
      },
      delete: () => {
        const [channel] = args;
        console.log(`Canal supprimé: ${channel}`);
        context.deleteChannel(channel);
      },
      join: () => {
        const [channel] = args;
        console.log(`Rejoint le canal: ${channel}`);
        context.joinChannel(channel);
      },
      quit: () => {
        const [channel] = args;
        console.log(`Quitte le canal: ${channel}`);
        context.quitChannel(channel);
      },
      users: () => {
        console.log("Liste des utilisateurs dans le canal");
        context.listUsers();
      },
      msg: () => {
        const [nickname, ...messageParts] = args;
        const message = messageParts.join(" ");
        console.log(`Message privé à ${nickname}: ${message}`);
        context.sendPrivateMessage(nickname, message);
      },
      default: () => {
        console.log("Commande inconnue");
      }
    };
  
    (actions[command] || actions.default)();
  };
  
  export { executeCommand };