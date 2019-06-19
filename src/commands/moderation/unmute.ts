import Command from "../../Command";
import Mashu from "../../utils/MashuClient";
import { ICommandContext } from "../../interfaces/ICommandContext";
import { isGuildChannel } from "../../utils/Helpers";
import { Message, AnyGuildChannel } from "eris";

export default class Mute extends Command {
    public constructor(category: string) {
        super({
            name: "unmute",
            description: "Unmute a user in the current guild",
            usage: "unmute <member: string|mention> [reason: string]",
            category: category,
            guildOnly: true,
            requiredArgs: 2,
            userPermissions: ["sendMessages", "manageRoles"],
            botPermissions: ["readMessages", "sendMessages", "manageRoles"]
        });
    }

    public async run(msg: Message, args: string[], client: Mashu, { settings, database }: ICommandContext): Promise<Message | undefined> {
        if (!isGuildChannel(msg.channel)) return await msg.channel.createMessage("This can only be used in a guild");
        const channel = msg.channel as AnyGuildChannel;

        const guild = await database.guild.findOne({ "id": channel.guild.id }).exec();
        if (guild && guild.muteRole) {
            const userToUnmute = args.shift() || "";
            const reason = args.join(" ");
            const member = this.findMember(msg, userToUnmute);
            if (!member) return await msg.channel.createMessage(`Couldn't find a member with the name **${userToUnmute}**`);

            const user = guild.users.find((u) => u.id === member.user.id);
            if (user) {
                user.isMuted = false;
            } else {
                guild.users.push({ id: member.user.id, isMuted: false, isBanned: false, warns: [], bans: [], kicks: [], notes: [] });
            }

            if (guild.logChannel) {
                await client.createMessage(guild.logChannel, {
                    embed: {
                        title: "UNMUTE",
                        color: settings.colors.unmute,
                        description: `**Unmuted:** ${member.user.mention}\n` +
                            `**By:** ${msg.author.mention}\n` +
                            `**Reason:** ${reason}`,
                        timestamp: (new Date()).toISOString(),
                        footer: { text: `ID: ${member.user.id}` }
                    }
                });
            }

            await member.removeRole(guild.muteRole, reason);
            await database.guild.updateOne({ "id": channel.guild.id }, guild).exec();
        }
    }
}
