import { GuildModel } from "../structures/Mongoose";
import { Guild, Member } from "eris";
import { IEvent } from "../interfaces/IEvent";

/** Handle muted members trying to re-join the server */
export const event: IEvent = {
    name: "guildMemberAdd",
    run: async (client, settings, ...args) => {
        const guild: Guild = args[0];
        const member: Member = args[1];

        const dbGuild = await GuildModel.findOne({ "id": guild.id }).exec();
        if (dbGuild && dbGuild.muteRole) {
            const user = dbGuild.users.find((u) => u.id === member.user.id);
            if (user && user.isMuted) {
                const reason = "Member left while being muted, re-added muted role until a moderator unmutes the member";
                if (dbGuild.logChannel) {
                    await client.createMessage(dbGuild.logChannel, {
                        embed: {
                            title: "MUTE",
                            color: settings.colors.mute,
                            description: `**Muted:** ${member.user.mention}\n` +
                                `**By:** ${client.user.mention}\n` +
                                `**Reason:** ${reason}`,
                            timestamp: (new Date()).toISOString(),
                            footer: { text: `ID: ${member.user.id}` }
                        }
                    });
                }

                await member.addRole(dbGuild.muteRole, `[MUTED] ${reason}`);
            }
        }
    }
};
