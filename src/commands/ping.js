module.exports = {
    userPermissions: ["sendMessages"],
    botPermissions: [
        "readMessages",
        "sendMessages"
    ],
    guildOnly: false,
    description: "Testing the bot",
    usage: "ping",
    run: async (msg/* , args, client, ctx */) => {
        await msg.channel.createMessage("Pong!");
    }
};
