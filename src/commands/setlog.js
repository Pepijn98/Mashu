const Command = require("../Command");

class Setlog extends Command {
    constructor() {
        super({
            name: "setlog",
            description: "Set the log channel",
            usage: "setlog <channel: string>",
            guildOnly: true,
            requiredArgs: 1,
            userPermissions: ["sendMessages", "manageChannels"],
            botPermissions: ["readMessages", "sendMessages"]
        });
    }

    async run(msg, args, _client, { database }) {
        let channelId = "";
        if ((/^\d{17,18}/).test(args[0])) {
            channelId = args[0];
        } else {
            const channel = msg.channel.guild.channels.find((c) => c.name.toLowerCase().indexOf(args[0].toLowerCase()) > -1);
            channelId = channel.id;
            if (!channel) return await msg.channel.createMessage("Couldn't find a channel with that name.");
        }

        await database.guild.updateOne({ "id": msg.channel.guild.id }, { "logChannel": channelId });
        await msg.channel.createMessage(`Changed log channel to <#${channelId}>`);
    }
}

module.exports = Setlog;
