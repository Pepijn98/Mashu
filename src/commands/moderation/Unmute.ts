import Command from "~/Command";
import settings from "~/settings";
import Users from "~/models/Users";
import { ICommandContext } from "~/types/ICommandContext";
import { Message } from "eris";
import { isGuildChannel } from "~/utils/Utils";

export default class Mute extends Command {
    constructor(category: string) {
        super({
            name: "unmute",
            description: "Unmute a user in the current guild",
            usage: "unmute <member: string|mention> [reason: string]",
            example: "unmute Kurozero Has been muted for long enough",
            category: category,
            guildOnly: true,
            requiredArgs: 2,
            userPermissions: ["sendMessages", "manageRoles"],
            botPermissions: ["readMessages", "sendMessages", "manageRoles"]
        });
    }

    async run(msg: Message, args: string[], { client }: ICommandContext): Promise<void> {
        if (!isGuildChannel(msg.channel)) {
            await msg.channel.createMessage("This can only be used in a guild");
            return;
        }

        if (settings.options.muteRole) {
            const userToUnmute = args.shift() || "";
            const reason = args.join(" ");
            const member = this.findMember(msg.channel, userToUnmute);
            if (!member) {
                await msg.channel.createMessage(`Couldn't find a member with the name **${userToUnmute}**`);
                return;
            }

            try {
                await member.removeRole(settings.options.muteRole, reason);

                const user = await Users.findOne({ id: member.user.id }).exec();
                if (user) {
                    user.isMuted = false;
                }

                if (settings.options.logChannel) {
                    await client.createMessage(settings.options.logChannel, {
                        embed: {
                            title: "UNMUTE",
                            color: settings.colors.unmute,
                            description: `**Unmuted:** ${member.user.mention}\n` + `**By:** ${msg.author.mention}\n` + `**Reason:** ${reason}`,
                            timestamp: new Date().toISOString(),
                            footer: {
                                text: `ID: ${member.user.id}`
                            }
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
        }
    }
}
