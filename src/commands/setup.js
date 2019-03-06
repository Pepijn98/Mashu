const Command = require("../Command");

class Ping extends Command {
    constructor() {
        super({
            name: "setup",
            description: "Setup some basic moderation info",
            usage: "setup [--skip <logchannel|muterole>]",
            guildOnly: true,
            userPermissions: ["manageGuild"]
        });
    }

    async run(msg, args, _client, { database }) {
        if (args.length >= 2 && (args[0] === "--skip" || args[0] === "-s")) {
            args.shift();
            const remainder = args.join(" ");
            switch (remainder) {
                case "logchannel":
                    const resp1 = await this.createMuteRole(msg, database);
                    if (resp1 === false) await msg.channel.createMessage("Successfully exited setup.");
                    break;
                case "muterole":
                    const resp2 = await this.askLogChannel(msg, database);
                    if (resp2 === false) await msg.channel.createMessage("Successfully exited setup.");
                    break;
                default:
                    await msg.channel.createMessage(`Option ${remainder} isn't skippable or isn't an option at all.`);
                    break;
            }
        } else {
            const resp1 = await this.askLogChannel(msg, database);
            if (resp1 === false) return await msg.channel.createMessage("Successfully exited setup.");
            const resp2 = await this.createMuteRole(msg, database);
            if (resp2 === false) await msg.channel.createMessage("Successfully exited setup.");
        }
    }

    async askLogChannel(msg, database) {
        await msg.channel.createMessage(`${msg.author.mention}, What will be the log channel?\nPlease reply with either the channel name, id or mention the channel.\nType \`exit\` to stop.`);

        let responses = await msg.channel.awaitMessages((m) => m.author.id === msg.author.id, { time: 15000, maxMatches: 1 });
        if (responses.length) {
            const content = responses[0]
                ? responses[0].content.toLowerCase()
                : null;

            if (content === null) return await msg.channel.createMessage("Error getting a response");
            if (content === "exit") return false;

            let channelId = "";
            if ((/^\d{17,18}/).test(content)) {
                channelId = content;
            } else {
                const channel = msg.channel.guild.channels.find((c) => c.name.toLowerCase().indexOf(content) > -1);
                channelId = channel.id;
                if (!channel) return await msg.channel.createMessage("Couldn't find a channel with that name.");
            }

            await database.guild.updateOne({ "id": msg.channel.guild.id }, { "logChannel": channelId });
            await msg.channel.createMessage(`Changed log channel to <#${channelId}>`);
        } else {
            await msg.channel.createMessage(`${msg.author.mention}, Times up! You've waited too long to respond.`);
        }
    }

    async createMuteRole(msg, database) {
        await msg.channel.createMessage(`${msg.author.mention}, Do you want to create a new muted role?\nPlease reply with either (y)es or (n)o.\nType \`exit\` to stop.`);

        let responses = await msg.channel.awaitMessages((m) => m.author.id === msg.author.id, { time: 15000, maxMatches: 1 });
        if (responses.length) {
            const content = responses[0]
                ? responses[0].content.toLowerCase()
                : null;

            if (content === null) return await msg.channel.createMessage("Error getting a response");
            if (content === "exit") return false;

            if (content.startsWith("y")) {
                const newRole = await msg.channel.guild.createRole({ name: "Muted", permissions: 0, hoist: false, mentionable: false }, "[Chloe] Default muted role");
                await database.guild.updateOne({ "id": msg.channel.guild.id }, { "muteRole": newRole.id });
                await msg.channel.createMessage(`Created new role with the name **${newRole.name}** and saved it as the default mute role.`);
                for (let item of msg.channel.guild.channels) {
                    const channel = item[1];
                    const override = channel.permissionOverwrites.find((o) => o.id === newRole.id);
                    if ((override && override.deny !== 55360) || (!override)) {
                        await channel.editPermission(newRole.id, 0, 55360, "role", "Create muted overrides");
                    }
                }
            } else if (content.startsWith("n")) {
                let muted = msg.channel.guild.roles.find((role) => role.name.toLowerCase() === "muted");
                if (!muted) {
                    await msg.channel.createMessage("Tried to find a role with the name `muted` but couldn't find anything.\nMuted setup incorrectly please run this command again.");
                } else {
                    await database.guild.updateOne({ "id": msg.channel.guild.id }, { "muteRole": muted.id });
                    await msg.channel.createMessage(`Found a role with the name **${muted.name}** and saved it as the default mute role.`);
                    for (let item of msg.channel.guild.channels) {
                        const channel = item[1];
                        const override = channel.permissionOverwrites.find((o) => o.id === muted.id);
                        if ((override && override.deny !== 55360) || (!override)) {
                            await channel.editPermission(muted.id, 0, 55360, "role", "Create muted overrides");
                        }
                    }
                }
            }
        } else {
            await msg.channel.createMessage(`${msg.author.mention}, Times up! You've waited too long to respond.`);
        }
    }
}

module.exports = Ping;
