import Command from "../../Command";
import Mashu from "../../structures/MashuClient";
import { ICommandContext } from "../../interfaces/ICommandContext";
import { Message, AnyGuildChannel } from "eris";

export default class Warn extends Command {
    public constructor(category: string) {
        super({
            name: "warn",
            description: "Warn a user from the current guild",
            usage: "warn <member: string|mention> [reason: string]",
            example: "warn Kurozero Posting bad messages",
            category: category,
            guildOnly: true,
            requiredArgs: 2,
            userPermissions: ["sendMessages", "kickMembers"],
            botPermissions: ["readMessages", "sendMessages"]
        });
    }

    public async run(msg: Message, args: string[], client: Mashu, { settings, database }: ICommandContext): Promise<Message | undefined> {
        if (!msg.channel.isGuildChannel) return await msg.channel.createMessage("This can only be used in a guild");
        const channel = msg.channel as AnyGuildChannel;

        const userToWarn = args.shift() || "";
        const member = this.findMember(msg, userToWarn);

        if (!member) return await msg.channel.createMessage("Couldn't find a member.");

        const reason = args.join(" ");
        try {
            const guild = await database.guild.findOne({ "id": channel.guild.id }).exec();
            if (guild) {
                const user = guild.users.find((o) => o.id === member.user.id);
                const newWarn = { id: this.generateId(), timestamp: (new Date()).toISOString(), by: msg.author.id, reason: reason };
                let warnCount = 1;
                if (user) {
                    user.warns.push(newWarn);
                    warnCount = user.warns.length;
                } else {
                    guild.users.push({ id: member.user.id, isBanned: false, isMuted: false, warns: [newWarn], bans: [], kicks: [], notes: [] });
                }

                if (guild.logChannel) {
                    await client.createMessage(guild.logChannel, {
                        embed: {
                            title: "WARN",
                            color: settings.colors.warn,
                            description: `**Warned:** ${member.user.mention}\n` +
                                `**By:** ${msg.author.mention}\n` +
                                `**Reason:** ${reason}\n` +
                                `User has been warned ${warnCount} ${warnCount === 1 ? "time" : "times"}`,
                            timestamp: newWarn.timestamp,
                            footer: { text: `ID: ${member.user.id}` }
                        }
                    });
                }

                await database.guild.updateOne({ "id": channel.guild.id }, guild).exec();
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
            const chan = await member.user.getDMChannel();
            await chan.createMessage(`You have been warned in: **${channel.guild.name}**\nBy: **${msg.author.username}**\nWith reason: **${reason}**`);
        } catch (error) {
            await msg.channel.createMessage("Couldn't DM the banned member.");
        }
    }
}

module.exports = Warn;
