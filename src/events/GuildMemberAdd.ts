import Users from "~/models/Users";
import settings from "~/settings";
import Event from "~/types/IEvent";
import { Guild, Member } from "eris";

/** Handle muted members trying to re-join the server */
export const event: Event = {
    name: "guildMemberAdd",
    run: async (client, guild: Guild, member: Member) => {
        if (guild.id !== settings.options.guild) return;
        if (settings.options.muteRole) {
            const user = await Users.findOne({ id: member.user.id }).exec();
            if (user && user.isMuted) {
                const reason = "Member left while being muted, re-added mute role until a moderator unmutes the member";
                if (settings.options.logChannel) {
                    await client.createMessage(settings.options.logChannel, {
                        embed: {
                            title: "MUTE",
                            color: settings.colors.mute,
                            description: `**Muted:** ${member.user.mention}\n` + `**By:** ${client.user.mention}\n` + `**Reason:** ${reason}`,
                            timestamp: new Date(),
                            footer: { text: `ID: ${member.user.id}` }
                        }
                    });
                }

                await member.addRole(settings.options.muteRole, `[MUTED] ${reason}`);
            }
        }
    }
};

export default event;
