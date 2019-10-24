import Command from "../../Command";
import Mashu from "../../structures/MashuClient";
import { ICommandContext } from "../../interfaces/ICommandContext";
import { Message, AnyGuildChannel } from "eris";

export default class Ban extends Command {
    public constructor(category: string) {
        super({
            name: "ban",
            description: "Ban a user from the current guild",
            usage: "ban <member: string|mention> [reason: string]",
            example: "ban Kurozero Has been a bad boy >:(",
            category: category,
            guildOnly: true,
            requiredArgs: 2,
            userPermissions: ["sendMessages", "banMembers"],
            botPermissions: ["readMessages", "sendMessages", "banMembers"]
        });
    }

    public async run(msg: Message, args: string[], client: Mashu, { settings, database }: ICommandContext): Promise<Message | undefined> {
        if (!msg.channel.isGuildChannel) return await msg.channel.createMessage("This can only be used in a guild");
        const channel = msg.channel as AnyGuildChannel;

        const userToBan = args.shift();
        const reason = args.join(" ");
        const member = this.findMember(msg, userToBan!);

        if (!member) return await msg.channel.createMessage("Couldn't find a member.");

        try {
            await member.ban(7, reason);

            const guild = await database.guild.findOne({ "id": channel.guild.id }).exec();
            if (guild) {
                const user = guild.users.find((o) => o.id === member.user.id);
                const newBan = { id: this.generateId(), timestamp: (new Date()).toISOString(), by: msg.author.id, reason: reason };
                let banCount = 1;
                if (user) {
                    user.isBanned = true;
                    user.bans.push(newBan);
                    banCount = user.bans.length;
                } else {
                    guild.users.push({ id: member.user.id, isBanned: true, isMuted: false, warns: [], bans: [newBan], kicks: [], notes: [] });
                }

                if (guild.logChannel) {
                    await client.createMessage(guild.logChannel, {
                        embed: {
                            title: "BAN",
                            color: settings.colors.ban,
                            description: `**Banned:** ${member.user.mention}\n` +
                                `**By:** ${msg.author.mention}\n` +
                                `**Reason:** ${reason}\n` +
                                `User has been banned ${banCount} ${banCount === 1 ? "time" : "times"}`,
                            timestamp: newBan.timestamp,
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
            await dm.createMessage(`You have been banned from: **${channel.guild.name}**\nBy: **${msg.author.username}**\nWith reason: **${reason}**`);
        } catch (error) {
            await msg.channel.createMessage("Couldn't DM the banned member.");
        }
    }
}
