const Command = require("../Command");

class Ping extends Command {
    constructor() {
        super({
            name: "setup",
            description: "Testing await messages",
            usage: "setup"
        });
    }

    async run(msg, _args, _client, { database }) {
        await this.askLogChannel(msg, database);
        await this.createMuteRole(msg, database);
    }

    async askLogChannel(msg, database) {
        await msg.channel.createMessage("What will be the log channel? Please reply with either the channel name, id or mention the channel.");

        let responses = await msg.channel.awaitMessages((m) => m.author.id === msg.author.id, { time: 10000, maxMatches: 1 });
        if (responses.length) {
            const m = responses[0];
            let channelId = "";
            if ((/^\d{17,18}/).test(m.content)) {
                channelId = m.content;
            } else {
                const channel = msg.channel.guild.channels.find((c) => c.name.toLowerCase().indexOf(m.content.toLowerCase()) > -1);
                channelId = channel.id;
                if (!channel) return await msg.channel.createMessage("Couldn't find a channel with that name.");
            }

            await database.guild.updateOne({ "id": msg.channel.guild.id }, { "logChannel": channelId });
            await msg.channel.createMessage(`Changed log channel to <#${channelId}>`);
        }
    }

    async createMuteRole(msg, database) {
        await msg.channel.createMessage("Do you want to create a new muted role? Please reply with yes or no.");

        let responses = await msg.channel.awaitMessages((m) => m.author.id === msg.author.id, { time: 10000, maxMatches: 1 });
        if (responses.length) {
            const m = responses[0];
            if (m.content.toLowerCase().startsWith("y")) {
                const newRole = await msg.channel.guild.createRole({ name: "Muted", permissions: 0, hoist: false, mentionable: false }, "[Chloe] Default muted role");
                await database.guild.updateOne({ "id": msg.channel.guild.id }, { "muteRole": newRole.id });
                await msg.channel.createMessage(`Created new role with the name ${newRole.name} and saved it as the default mute role.`);
                msg.channel.guild.channels.forEach(async (c) => {
                    await c.editPermission(newRole.id, 0, 55360, "role", "Create muted overrides");
                });
            } else if (m.content.toLowerCase().startsWith("n")) {
                let muted = msg.channel.guild.roles.find((role) => role.name.toLowerCase() === "muted");
                if (!muted) {
                    await msg.channel.createMessage("Tried to find a role with the name `muted` but couldn't find anything.\nMuted setup incorrectly please run this command again.");
                } else {
                    await database.guild.updateOne({ "id": msg.channel.guild.id }, { "muteRole": muted.id });
                    await msg.channel.createMessage(`Found a role with the name ${muted.name} and saved it as the default mute role.`);
                    msg.channel.guild.channels.forEach(async (c) => {
                        await c.editPermission(muted.id, 0, 55360, "role", "Create muted overrides");
                    });
                }
            }
        }
    }
}

module.exports = Ping;
