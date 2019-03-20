const Command = require("../../Command");

class Kick extends Command {
    constructor() {
        super({
            name: "kick",
            description: "Kick a user from the current guild",
            usage: "kick <member: string|mention> [reason: string]",
            category: "moderation",
            guildOnly: true,
            requiredArgs: 2,
            userPermissions: ["sendMessages", "kickMembers"],
            botPermissions: ["readMessages", "sendMessages", "kickMembers"]
        });
    }

    async run(msg, args, client, { settings, database }) {
        const userToKick = args.shift();
        const reason = args.join(" ");
        const member = this.findMember(msg, userToKick);

        if (!member) return await msg.channel.createMessage("Couldn't find a member.");

        try {
            await member.kick(reason);

            const guild = await database.guild.findOne({ "id": msg.channel.guild.id }).exec();
            if (guild) {
                const user = guild.users.find((o) => o.id === member.user.id);
                const newKick = { id: this.generateId(), timestamp: (new Date()).toISOString(), by: msg.author.id, reason: reason };
                let kickCount = 1;
                if (user) {
                    user.kicks.push(newKick);
                    kickCount = user.kicks.length;
                } else {
                    guild.users.push({ id: member.user.id, kicks: [newKick] });
                }

                if (guild.logChannel) {
                    await client.createMessage(guild.logChannel, {
                        embed: {
                            title: "KICK",
                            color: settings.colors.kick,
                            description: `**Kicked:** ${member.user.mention}\n` +
                                `**By:** ${msg.author.mention}\n` +
                                `**Reason:** ${reason}\n` +
                                `User has been kicked ${kickCount} ${kickCount === 1 ? "time" : "times"}`,
                            timestamp: newKick.timestamp,
                            footer: { text: `ID: ${member.user.id}` }
                        }
                    });
                }

                await database.guild.updateOne({ "id": msg.channel.guild.id }, guild).exec();
            }
        } catch (error) {
            return await msg.channel.createMessage({
                embed: {
                    color: settings.colors.error,
                    description: error.toString()
                }
            });
        }

        try {
            const channel = await member.user.getDMChannel();
            await channel.createMessage(`You have been kicked from: **${msg.channel.guild.name}**\nBy: **${msg.author.username}**\nWith reason: **${reason}**`);
        } catch (error) {
            await msg.channel.createMessage("Couldn't DM the banned member.");
        }
    }
}

module.exports = Kick;
