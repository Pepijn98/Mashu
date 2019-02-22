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
    description: "Unban a user from the current guild",
    usage: "unban <member: string> [reason: string]",
    run: async (msg, args, _, ctx) => {
        const userToUnban = args.shift();
        const reason = args.join(" ");

        const bans = await msg.channel.guild.getBans();
        const entry = bans.find((e) => e.user.username.toLowerCase().indexOf(userToUnban.toLowerCase()) > -1);

        if (!entry) return await msg.channel.createMessage("Couldn't find a user with that name on the ban list.");

        try {
            await msg.channel.guild.unbanMember(entry.user.id, reason);
            // TODO: Implement logging
            // TODO: Implement database
        } catch (error) {
            await msg.channel.createMessage({
                embed: {
                    color: ctx.config.embedColor,
                    description: error.toString()
                }
            });
        }

        try {
            const channel = await entry.user.getDMChannel();
            await channel.createMessage(`You have been unbanned from: **[${msg.channel.guild.name}]**\nBy: **[${msg.author.username}]**\nWith reason: **[${reason}]**`);
        } catch (error) {
            await msg.channel.createMessage("Couldn't DM the unbanned user.");
        }
    }
};
