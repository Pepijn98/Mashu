import Command from "../../Command";
import Mashu from "../../utils/MashuClient";
import { ICommandContext } from "../../interfaces/ICommandContext";
import { isGuildChannel } from "../../utils/Helpers";
import { Message, AnyGuildChannel } from "eris";

export default class Kick extends Command {
    public constructor(category: string) {
        super({
            name: "kick",
            description: "Kick a user from the current guild",
            usage: "kick <member: string|mention> [reason: string]",
            category: category,
            guildOnly: true,
            requiredArgs: 2,
            userPermissions: ["sendMessages", "kickMembers"],
            botPermissions: ["readMessages", "sendMessages", "kickMembers"]
        });
    }

    public async run(msg: Message, args: string[], client: Mashu, { settings, database }: ICommandContext): Promise<Message | undefined> {
        if (!isGuildChannel(msg.channel)) return await msg.channel.createMessage("This can only be used in a guild");
        const channel = msg.channel as AnyGuildChannel;

        const userToKick = args.shift();
        const reason = args.join(" ");
        const member = this.findMember(msg, userToKick!);

        if (!member) return await msg.channel.createMessage("Couldn't find a member.");

        try {
            await member.kick(reason);

            const guild = await database.guild.findOne({ "id": channel.guild.id }).exec();
            if (guild) {
                const user = guild.users.find((o) => o.id === member.user.id);
                const newKick = { id: this.generateId(), timestamp: (new Date()).toISOString(), by: msg.author.id, reason: reason };
                let kickCount = 1;
                if (user) {
                    user.kicks.push(newKick);
                    kickCount = user.kicks.length;
                } else {
                    guild.users.push({ id: member.user.id, isBanned: false, isMuted: false, warns: [], bans: [], kicks: [newKick], notes: [] });
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
            const dm = await member.user.getDMChannel();
            await dm.createMessage(`You have been kicked from: **${channel.guild.name}**\nBy: **${msg.author.username}**\nWith reason: **${reason}**`);
        } catch (error) {
            await msg.channel.createMessage("Couldn't DM the banned member.");
        }
    }
}
