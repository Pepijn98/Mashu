const utils = require("../utils");

module.exports = {
    userPermissions: [
        "sendMessages",
        "kickMembers"
    ],
    botPermissions: [
        "readMessages",
        "sendMessages",
        "kickMembers"
    ],
    guildOnly: true,
    description: "Kick a user from the current guild",
    usage: "kick <member: string|mention> [reason: string]",
    run: async (msg, args, _, ctx) => {
        const userToKick = args.shift();
        const reason = args.join(" ");
        const member = utils.findMember(msg, userToKick);

        if (!member) return await msg.channel.createMessage("Couldn't find a member.");

        try {
            const channel = await member.user.getDMChannel();
            await channel.createMessage(`You have been kicked from: **[${msg.channel.guild.name}]**\nBy: **[${msg.author.username}]**\nWith reason: **[${reason}]**`);
        } catch (error) {
            await msg.channel.createMessage("Couldn't DM the banned member.");
        }

        try {
            await member.kick(reason);
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
