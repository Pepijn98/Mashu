import Command from "../../Command";
import Mashu from "../../utils/MashuClient";
import { ICommandContext } from "../../interfaces/ICommandContext";
import { isGuildChannel } from "../../utils/Helpers";
import { Message, AnyGuildChannel } from "eris";

export default class Unban extends Command {
    public constructor(category: string) {
        super({
            name: "unban",
            description: "Unban a user from the current guild",
            usage: "unban <member: string> [reason: string]",
            example: "unban Kurozero Has been banned for long enough",
            category: category,
            guildOnly: true,
            requiredArgs: 2,
            userPermissions: ["sendMessages", "banMembers"],
            botPermissions: ["readMessages", "sendMessages", "banMembers"]
        });
    }

    public async run(msg: Message, args: string[], client: Mashu, { settings, database }: ICommandContext): Promise<Message | undefined> {
        if (!isGuildChannel(msg.channel)) return await msg.channel.createMessage("This can only be used in a guild");
        const channel = msg.channel as AnyGuildChannel;

        const userToUnban = args.shift() || "";
        const reason = args.join(" ");

        const bans = await channel.guild.getBans();
        const entry = bans.find((e) => e.username.toLowerCase().indexOf(userToUnban.toLowerCase()) > -1);

        if (!entry) return await msg.channel.createMessage("Couldn't find a user with that name on the ban list.");

        try {
            await channel.guild.unbanMember(entry.id, reason);

            const guild = await database.guild.findOne({ "id": channel.guild.id }).exec();
            if (guild) {
                const user = guild.users.find((o) => o.id === entry.id);
                let banCount = 1;
                if (user) {
                    user.isBanned = false;
                    banCount = user.bans.length;
                }

                if (guild.logChannel) {
                    await client.createMessage(guild.logChannel, {
                        embed: {
                            title: "UNBAN",
                            color: settings.colors.unban,
                            description: `**Unbanned:** ${entry.username}#${entry.discriminator}\n` +
                                `**By:** ${msg.author.mention}\n` +
                                `**Reason:** ${reason}\n` +
                                `User has been banned ${banCount} ${banCount === 1 ? "time" : "times"}`,
                            timestamp: (new Date()).toISOString(),
                            footer: { text: `ID: ${entry.id}` }
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
            const chan = await entry.getDMChannel();
            await chan.createMessage(`You have been unbanned from: **${channel.guild.name}**\nBy: **${msg.author.username}**\nWith reason: **${reason}**`);
        } catch (error) {
            await msg.channel.createMessage("Couldn't DM the unbanned user.");
        }
    }
}
