import Command from "~/Command";
import Users from "~/models/Users";
import settings from "~/settings";
import { ICommandContext } from "~/types/ICommandContext";
import { Message } from "eris";
import { isGuildChannel } from "~/utils/Utils";

export default class Warn extends Command {
    constructor(category: string) {
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

    async run(msg: Message, args: string[], { client }: ICommandContext): Promise<void> {
        if (!isGuildChannel(msg.channel)) {
            await msg.channel.createMessage("This can only be used in a guild");
            return;
        }

        const userToWarn = args.shift() || "";
        const reason = args.join(" ");
        const member = this.findMember(msg.channel, userToWarn);

        if (!member) {
            await msg.channel.createMessage("Couldn't find a member");
            return;
        }

        try {
            let user = await Users.findOne({ id: member.user.id }).exec();
            if (!user) user = this.createDBUser(member.user.id);

            const timestamp = new Date().toISOString();
            user.warns.create({ id: this.generateId(), timestamp, by: msg.author.id, reason });

            if (settings.options.logChannel) {
                await client.createMessage(settings.options.logChannel, {
                    embed: {
                        title: "WARN",
                        color: settings.colors.warn,
                        description:
                            `**Warned:** ${member.user.mention}\n` +
                            `**By:** ${msg.author.mention}\n` +
                            `**Reason:** ${reason}\n` +
                            `User has been warned ${user.warns.length} ${user.warns.length === 1 ? "time" : "times"}`,
                        timestamp,
                        footer: {
                            text: `ID: ${member.user.id}`
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

        try {
            const dm = await member.user.getDMChannel();
            await dm.createMessage(`You have been warned in: **${msg.channel.guild.name}**\nBy: **${msg.author.username}**\nWith reason: **${reason}**`);
        } catch (error) {
            await msg.channel.createMessage("Couldn't DM the banned member");
        }
    }
}
