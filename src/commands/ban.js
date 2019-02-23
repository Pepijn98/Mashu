const utils = require("../utils");

module.exports = {
    userPermissions: [
        "sendMessages",
        "banMembers"
    ],
    botPermissions: [
        "readMessages",
        "sendMessages",
        "banMembers"
    ],
    guildOnly: true,
    description: "Ban a user from the current guild",
    usage: "ban <member: string|mention> [reason: string]",
    run: async (msg, args, client, ctx) => {
        const userToBan = args.shift();
        const reason = args.join(" ");
        const member = utils.findMember(msg, userToBan);

        if (!member) return await msg.channel.createMessage("Couldn't find a member.");

        try {
            await member.ban(7, reason);

            const guild = await ctx.database.guild.findOne({ "id": msg.channel.guild.id }).exec();
            if (guild) {
                const user = guild.users.find((o) => o.id === member.user.id);
                const newBan = { timestamp: (new Date()).toISOString(), by: msg.author.id, reason: reason };
                let banCount = 1;
                if (user) {
                    user.isBanned = true;
                    user.bans.push(newBan);
                    banCount = user.bans.length;
                } else {
                    guild.users.push({ id: member.user.id, isBanned: true, bans: [newBan] });
                }

                if (guild.logChannel) {
                    await client.createMessage(guild.logChannel, {
                        embed: {
                            title: "BAN",
                            color: ctx.config.embedColor,
                            description: `**Banned:** ${member.user.mention}\n` +
                                `**By:** ${msg.author.mention}\n` +
                                `**Reason:** ${reason}\n` +
                                `User has been banned ${banCount} ${banCount === 1 ? "time" : "times"}`,
                            timestamp: newBan.timestamp,
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
            await channel.createMessage(`You have been banned from: **[${msg.channel.guild.name}]**\nBy: **[${msg.author.username}]**\nWith reason: **[${reason}]**`);
        } catch (error) {
            await msg.channel.createMessage("Couldn't DM the banned member.");
        }
    }
};
