import Command from "~/Command";
import Users from "~/models/Users";
import settings from "~/settings";
import { ICommandContext } from "~/types/ICommandContext";
import { Message } from "eris";
import { isGuildChannel } from "~/utils/Utils";

export default class Unban extends Command {
    constructor(category: string) {
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

    async run(msg: Message, args: string[], { client }: ICommandContext): Promise<void> {
        if (!isGuildChannel(msg.channel)) {
            await msg.channel.createMessage("This can only be used in a guild");
            return;
        }

        const userToUnban = args.shift() || "";
        const reason = args.join(" ");

        const bans = await msg.channel.guild.getBans();
        const entry = bans.find((e) => e.user.username.toLowerCase().indexOf(userToUnban.toLowerCase()) > -1);

        if (!entry) {
            await msg.channel.createMessage("Couldn't find a user with that name on the ban list");
            return;
        }

        try {
            await msg.channel.guild.unbanMember(entry.user.id, reason);

            const user = await Users.findOne({ id: entry.user.id }).exec();
            let banCount: string | number = "unknown";
            if (user) {
                user.isBanned = false;
                banCount = user.bans.length;
            }

            if (settings.options.logChannel) {
                await client.createMessage(settings.options.logChannel, {
                    embed: {
                        title: "UNBAN",
                        color: settings.colors.unban,
                        description:
                            `**Unbanned:** ${entry.user.username}#${entry.user.discriminator}\n` +
                            `**By:** ${msg.author.mention}\n` +
                            `**Reason:** ${reason}\n` +
                            `User has been banned ${banCount} ${banCount === 1 ? "time" : "times"}`,
                        timestamp: new Date().toISOString(),
                        footer: { text: `ID: ${entry.user.id}` }
                    }
                });
            }

            await user?.save();
        } catch (error) {
            await msg.channel.createMessage({
                embed: {
                    color: settings.colors.error,
                    description: error.toString()
                }
            });
            return;
        }

        try {
            const chan = await entry.user.getDMChannel();
            await chan.createMessage(`You have been unbanned from: **${msg.channel.guild.name}**\nBy: **${msg.author.username}**\nWith reason: **${reason}**`);
        } catch (error) {
            await msg.channel.createMessage("Couldn't DM the unbanned user");
        }
    }
}
