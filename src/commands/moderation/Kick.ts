import Command from "~/Command";
import Users from "~/models/Users";
import settings from "~/settings";
import { ICommandContext } from "~/types/ICommandContext";
import { Message } from "eris";
import { isGuildChannel } from "~/utils/Utils";

export default class Kick extends Command {
    constructor(category: string) {
        super({
            name: "kick",
            description: "Kick a user from the current guild",
            usage: "kick <member: string|mention> [reason: string]",
            example: "kick Kurozero",
            category: category,
            guildOnly: true,
            requiredArgs: 2,
            userPermissions: ["sendMessages", "kickMembers"],
            botPermissions: ["readMessages", "sendMessages", "kickMembers"]
        });
    }

    async run(msg: Message, args: string[], { client }: ICommandContext): Promise<void> {
        if (!isGuildChannel(msg.channel)) {
            await msg.channel.createMessage("This can only be used in a guild");
            return;
        }

        const userToKick = args.shift();
        const reason = args.join(" ");
        const member = this.findMember(msg.channel, userToKick!);

        if (!member) {
            await msg.channel.createMessage("Couldn't find a member");
            return;
        }

        try {
            await member.kick(reason);

            let user = await Users.findOne({ id: member.user.id }).exec();
            if (!user) user = this.createDBUser(member.user.id);

            const timestamp = new Date().toISOString();
            user.kicks.create({ id: this.generateId(), timestamp, by: msg.author.id, reason });

            if (settings.options.logChannel) {
                await client.createMessage(settings.options.logChannel, {
                    embed: {
                        title: "KICK",
                        color: settings.colors.kick,
                        description:
                            `**Kicked:** ${member.user.mention}\n` +
                            `**By:** ${msg.author.mention}\n` +
                            `**Reason:** ${reason}\n` +
                            `User has been kicked ${user.kicks.length} ${user.kicks.length === 1 ? "time" : "times"}`,
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
            await dm.createMessage(`You have been kicked from: **${msg.channel.guild.name}**\nBy: **${msg.author.username}**\nWith reason: **${reason}**`);
        } catch (error) {
            await msg.channel.createMessage("Couldn't DM the banned member");
        }
    }
}
