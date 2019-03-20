const Command = require("../../Command");

class Mute extends Command {
    constructor() {
        super({
            name: "mute",
            description: "Mute a user in the current guild",
            usage: "mute <member: string|mention> [reason: string]",
            category: "moderation",
            guildOnly: true,
            requiredArgs: 2,
            userPermissions: ["sendMessages", "manageRoles"],
            botPermissions: ["readMessages", "sendMessages", "manageRoles"]
        });
    }

    async run(msg, args, client, { settings, database }) {
        const guild = await database.guild.findOne({ "id": msg.channel.guild.id }).exec();
        if (guild && guild.muteRole) {
            const userToMute = args.shift();
            const reason = args.join(" ");
            const member = this.findMember(msg, userToMute);
            if (!member) return await msg.channel.createMessage(`Couldn't find a member with the name **${userToMute}**`);

            const user = guild.users.find((u) => u.id === member.user.id);
            if (user) {
                user.isMuted = true;
            } else {
                guild.users.push({ id: member.user.id, isMuted: true, isBanned: false });
            }

            if (guild.logChannel) {
                await client.createMessage(guild.logChannel, {
                    embed: {
                        title: "MUTE",
                        color: settings.colors.mute,
                        description: `**Muted:** ${member.user.mention}\n` +
                            `**By:** ${msg.author.mention}\n` +
                            `**Reason:** ${reason}`,
                        timestamp: (new Date()).toISOString(),
                        footer: { text: `ID: ${member.user.id}` }
                    }
                });
            }

            await member.addRole(guild.muteRole, `[MUTED] ${reason}`);
            await database.guild.updateOne({ "id": msg.channel.guild.id }, guild).exec();
        }
    }
}

module.exports = Mute;
