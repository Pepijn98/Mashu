const Command = require("../Command");

class Warn extends Command {
    constructor() {
        super({
            name: "warn",
            description: "Warn a user from the current guild",
            usage: "warn <member: string|mention> [reason: string]",
            guildOnly: true,
            requiredArgs: 2,
            userPermissions: ["sendMessages", "kickMembers"],
            botPermissions: ["readMessages", "sendMessages", "kickMembers"]
        });
    }

    async run(msg, args, client, ctx) {
        const userToWarn = args.shift();
        const member = this.findMember(msg, userToWarn);

        if (!member) return await msg.channel.createMessage("Couldn't find a member.");

        const reason = args.join(" ");
        try {
            const guild = await ctx.database.guild.findOne({ "id": msg.channel.guild.id }).exec();
            if (guild) {
                const user = guild.users.find((o) => o.id === member.user.id);
                const newWarn = { id: this.generateId(), timestamp: (new Date()).toISOString(), by: msg.author.id, reason: reason };
                let warnCount = 1;
                if (user) {
                    user.warns.push(newWarn);
                    warnCount = user.warns.length;
                } else {
                    guild.users.push({ id: member.user.id, warns: [newWarn] });
                }

                if (guild.logChannel) {
                    await client.createMessage(guild.logChannel, {
                        embed: {
                            title: "WARN",
                            color: 0xe7ea25,
                            description: `**Warned:** ${member.user.mention}\n` +
                                `**By:** ${msg.author.mention}\n` +
                                `**Reason:** ${reason}\n` +
                                `User has been warned ${warnCount} ${warnCount === 1 ? "time" : "times"}`,
                            timestamp: newWarn.timestamp,
                            footer: { text: `ID: ${member.user.id}` }
                        }
                    });
                }

                await ctx.database.guild.updateOne({ "id": msg.channel.guild.id }, guild).exec();
            }
        } catch (error) {
            return await msg.channel.createMessage({
                embed: {
                    color: ctx.config.embedColor,
                    description: error.toString()
                }
            });
        }

        try {
            const channel = await member.user.getDMChannel();
            await channel.createMessage(`You have been warned in: **${msg.channel.guild.name}**\nBy: **${msg.author.username}**\nWith reason: **${reason}**`);
        } catch (error) {
            await msg.channel.createMessage("Couldn't DM the banned member.");
        }
    }
}

module.exports = Warn;
