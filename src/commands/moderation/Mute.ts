import moment, { unitOfTime } from "moment";
import Command from "../../Command";
import Mashu from "../../structures/MashuClient";
import { ICommandContext } from "../../interfaces/ICommandContext";
import { Message, AnyGuildChannel } from "eris";

export default class Mute extends Command {
    public constructor(category: string) {
        super({
            name: "mute",
            description: "Mute a user in the current guild",
            usage: "mute <member: string|mention> <expires: timeString | never> [reason: string]",
            example: "mute Kurozero never Because I can",
            category: category,
            guildOnly: true,
            requiredArgs: 2,
            userPermissions: ["sendMessages", "manageRoles"],
            botPermissions: ["readMessages", "sendMessages", "manageRoles"]
        });
    }

    public async run(msg: Message, args: string[], client: Mashu, { settings, database }: ICommandContext): Promise<Message | undefined> {
        if (!msg.channel.isGuildChannel) return await msg.channel.createMessage("This can only be used in a guild");
        const channel = msg.channel as AnyGuildChannel;

        const guild = await database.guild.findOne({ "id": channel.guild.id }).exec();
        if (guild && guild.muteRole) {
            const userToMute = args.shift() || "";
            const expires = args.shift() || "";
            const reason = args.join(" ");
            const member = this.findMember(msg, userToMute);
            if (!member) return await msg.channel.createMessage(`Couldn't find a member with the name **${userToMute}**`);

            const user = guild.users.find((u) => u.id === member.user.id);
            if (user) {
                const time = (expires.match(/\d+/gui) || [])[0];
                const str = (expires.match(/\D+/gui) || [])[0];
                user.expireAt = str !== "never" ? moment(Date.now()).utc().add(time, str as unitOfTime.Base).toDate() : undefined;
                user.isMuted = true;
            } else {
                const time = (expires.match(/\d+/gui) || [])[0];
                const str = (expires.match(/\D+/gui) || [])[0];
                guild.users.push({
                    id: member.user.id,
                    isBanned: false,
                    isMuted: true,
                    warns: [],
                    bans: [],
                    kicks: [],
                    notes: [],
                    expireAt: str !== "never" ? moment(Date.now()).utc().add(time, str as unitOfTime.Base).toDate() : undefined
                });
            }

            if (guild.logChannel) {
                await client.createMessage(guild.logChannel, {
                    embed: {
                        title: "MUTE",
                        color: settings.colors.mute,
                        description: `**Muted:** ${member.user.mention}\n` +
                            `**By:** ${msg.author.mention}\n` +
                            `**Reason:** ${reason}`,
                        timestamp: (new Date()).toISOString(),
                        footer: { text: `ID: ${member.user.id}` }
                    }
                });
            }

            await member.addRole(guild.muteRole, `[MUTED] ${reason}`);
            await database.guild.updateOne({ "id": channel.guild.id }, guild).exec();
        }
    }
}
