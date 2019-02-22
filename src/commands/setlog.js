module.exports = {
    userPermissions: [
        "sendMessages",
        "manageChannels"
    ],
    botPermissions: [
        "readMessages",
        "sendMessages"
    ],
    guildOnly: false,
    description: "Testing the bot",
    usage: "setlog <channel: string|mention>",
    args: [
        "required",
        1
    ],
    run: async (msg, args, _client, { database }) => {
        let channelId = "";
        if ((/^<#\d{17,18}>/).test(args[0])) {
            channelId = args[0];
        } else {
            const channel = msg.channel.guild.channels.find((c) => c.name.toLowerCase().indexOf(args[0].toLowerCase()) > -1);
            channelId = channel.id;
            if (!channel) return await msg.channel.createMessage("Couldn't find a channel with that name.");
        }

        await database.guild.updateOne({ "id": msg.channel.guild.id }, { "logChannel": channelId });
        await msg.channel.createMessage(`Changed log channel to <#${channelId}>`);
    }
};
