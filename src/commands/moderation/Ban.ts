import settings from "~/settings";
import yn from "~/utils/yn";
import Command from "~/Command";
import Users from "~/models/Users";
import { ICommandContext } from "~/types/ICommandContext";
import { isGuildChannel } from "~/utils/Utils";
import { Message } from "eris";

export default class Ban extends Command {
    constructor(category: string) {
        super({
            name: "ban",
            description: "Ban a user from the current guild",
            usage: "ban <member: string|mention> <isMember: boolean> <reason: string>",
            example: "ban Kurozero true Has been a bad boy >:(",
            category: category,
            guildOnly: true,
            requiredArgs: 3,
            userPermissions: ["sendMessages", "banMembers"],
            botPermissions: ["readMessages", "sendMessages", "banMembers"]
        });
    }

    async run(msg: Message, args: string[], { client }: ICommandContext): Promise<void> {
        if (!isGuildChannel(msg.channel)) {
            await msg.channel.createMessage("This can only be used in a guild");
            return;
        }

        const userToBan = args.shift() || "";
        const isMember = yn(args.shift(), false);
        const reason = args.join(" ");

        let member = null;
        try {
            if (isMember) {
                member = this.findMember(msg.channel, userToBan!);

                if (!member) {
                    await msg.channel.createMessage("Couldn't find a member");
                    return;
                }

                await member.ban(7, reason);

                try {
                    const dm = await member!.user.getDMChannel();
                    await dm.createMessage(`You have been banned from: **${msg.channel.guild.name}**\nBy: **${msg.author.username}**\nWith reason: **${reason}**`);
                } catch (error) {
                    await msg.channel.createMessage("Couldn't DM the banned member");
                }
            } else {
                if ((/^\d{17,18}$/u).test(userToBan)) {
                    return;
                }
                await client.banGuildMember(msg.channel.guild.id, "", 7, reason);
            }

            let user = await Users.findOne({ id: member?.user?.id || userToBan }).exec();
            if (!user) user = this.createDBUser(member?.user?.id || userToBan);

            const timestamp = new Date().toISOString();
            const entry = user.bans.create({ id: this.generateId(), timestamp, by: msg.author.id, reason });
            user.bans.push(entry);
            user.isBanned = true;

            if (settings.options.logChannel) {
                await client.createMessage(settings.options.logChannel, {
                    embed: {
                        title: "BAN",
                        color: settings.colors.ban,
                        description:
                            `**Banned:** ${member?.user?.mention || `<@!${userToBan}>`}\n` +
                            `**By:** ${msg.author.mention}\n` +
                            `**Reason:** ${reason}\n` +
                            `User has been banned ${user.bans.length} ${user.bans.length === 1 ? "time" : "times"}`,
                        timestamp,
                        footer: {
                            text: `ID: ${member?.user?.id || userToBan}`
                        }
                    }
                });
            }

            await user.save();
        } catch (error) {
            await msg.channel.createMessage({
                embed: {
                    color: settings.colors.error,
                    description: error.toString()
                }
            });
            return;
        }
    }
}
