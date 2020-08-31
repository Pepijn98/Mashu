import Command from "~/Command";
import settings from "~/settings";
import Users from "~/models/Users";
import moment, { unitOfTime } from "moment";
import { ICommandContext } from "~/types/ICommandContext";
import { Message } from "eris";
import { isGuildChannel } from "~/utils/Utils";

export default class Mute extends Command {
    constructor(category: string) {
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

    async run(msg: Message, args: string[], { client }: ICommandContext): Promise<void> {
        if (!isGuildChannel(msg.channel)) {
            await msg.channel.createMessage("This can only be used in a guild");
            return;
        }

        if (settings.options.muteRole) {
            const userToMute = args.shift() || "";
            const expires = args.shift() || "";
            const reason = args.join(" ");
            const member = this.findMember(msg.channel, userToMute);
            if (!member) {
                await msg.channel.createMessage(`Couldn't find a member with the name **${userToMute}**`);
                return;
            }

            let user = await Users.findOne({ id: member.user.id }).exec();
            if (!user) user = this.createDBUser(member.user.id);

            const time = (expires.match(/\d+/giu) || [])[0];
            const str = (expires.match(/\D+/giu) || [])[0];
            user.expireAt =
                str !== "never"
                    ? moment(Date.now())
                        .utc()
                        .add(time, str as unitOfTime.Base)
                        .toDate()
                    : undefined;
            user.isMuted = true;

            if (settings.options.logChannel) {
                await client.createMessage(settings.options.logChannel, {
                    embed: {
                        title: "MUTE",
                        color: settings.colors.mute,
                        description: `**Muted:** ${member.user.mention}\n` + `**By:** ${msg.author.mention}\n` + `**Reason:** ${reason}`,
                        timestamp: new Date().toISOString(),
                        footer: {
                            text: `ID: ${member.user.id}`
                        }
                    }
                });
            }

            await member.addRole(settings.options.muteRole, `[MUTED] ${reason}`);
            await user.save();
        }
    }
}
