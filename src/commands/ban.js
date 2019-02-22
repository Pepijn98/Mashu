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
    run: async (msg, args, _, ctx) => {
        const userToBan = args.shift();
        const reason = args.join(" ");
        const member = utils.findMember(msg, userToBan);

        if (!member) return await msg.channel.createMessage("Couldn't find a member.");

        try {
            const channel = await member.user.getDMChannel();
            await channel.createMessage(`You have been banned from: **[${msg.channel.guild.name}]**\nBy: **[${msg.author.username}]**\nWith reason: **[${reason}]**`);
        } catch (error) {
            await msg.channel.createMessage("Couldn't DM the banned member.");
        }

        try {
            await member.ban(7, reason);
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
    }
};
