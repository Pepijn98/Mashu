const Command = require("../../Command");
const { sleep } = require("../../utils/Helpers");

class Setup extends Command {
    constructor(category) {
        super({
            name: "setup",
            description: "Setup some basic moderation info",
            usage: "setup",
            category: category,
            guildOnly: true,
            userPermissions: ["sendMessages", "manageGuild"]
        });
    }

    async run(msg, _args, _client, { database }) {
        await msg.channel.createMessage(`Hello ${msg.author.mention}, I'm gonna ask you a series of questions starting in 5 seconds.\nPlease reply within 15 seconds for each question.\nType \`exit\` at anytime to stop.`);
        await sleep(5000);

        const logChannel = await this.askLogChannel(msg, database);
        if (logChannel === false) return await msg.channel.createMessage("Successfully exited setup.");

        const suggestionChannel = await this.askSuggestionChannel(msg, database);
        if (suggestionChannel === false) return await msg.channel.createMessage("Successfully exited setup.");

        const notifyCreator = await this.askNotifyCreator(msg, database);
        if (notifyCreator === false) return await msg.channel.createMessage("Successfully exited setup.");

        const muteRole = await this.createMuteRole(msg, database);
        if (muteRole === false) return await msg.channel.createMessage("Successfully exited setup.");

        await sleep(1000);
        await msg.channel.createMessage(`${msg.author.mention}, That was the last question. Setup successfully completed!`);
    }

    async askLogChannel(msg, database) {
        await msg.channel.createMessage(`${msg.author.mention}, What will be the log channel?\nPlease reply with either the channel name, id or mention the channel.`);

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

    async askSuggestionChannel(msg, database) {
        await msg.channel.createMessage(`${msg.author.mention}, What will be the suggestions channel?\nPlease reply with either the channel name, id or mention the channel.`);

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

            await database.guild.updateOne({ "id": msg.channel.guild.id }, { "suggestionChannel": channelId });
            await msg.channel.createMessage(`Changed log channel to <#${channelId}>`);
        } else {
            await msg.channel.createMessage(`${msg.author.mention}, Times up! You've waited too long to respond.`);
        }
    }

    async askNotifyCreator(msg, database) {
        await msg.channel.createMessage(`${msg.author.mention}, Do you want to notify the creator of a suggestion when it gets accepted or denied?\nPlease reply with either (y)es or (n)o.`);

        let responses = await msg.channel.awaitMessages((m) => m.author.id === msg.author.id, { time: 15000, maxMatches: 1 });
        if (responses.length) {
            const content = responses[0]
                ? responses[0].content.toLowerCase()
                : "";

            if (!content) return await msg.channel.createMessage("Error getting a response");
            if (content === "exit") return false;

            const update = content.toLowerCase().startsWith("y") ? true : content.toLowerCase().startsWith("n") ? false : null;
            if (!update) return await msg.channel.createMessage("Invalid reply, reply with either yes or no.");

            await database.guild.updateOne({ "id": msg.channel.guild.id }, { "notifyCreator": update });
            await msg.channel.createMessage(update ? "Okay! I will notify the creator whenever their suggestion gets updated." : "Okay! I won't notify the suggestion creators.");
        } else {
            await msg.channel.createMessage(`${msg.author.mention}, Times up! You've waited too long to respond.`);
        }
    }

    async createMuteRole(msg, database) {
        await msg.channel.createMessage(`${msg.author.mention}, Do you want to create a new muted role?\nPlease reply with either (y)es or (n)o.`);

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

module.exports = Setup;
