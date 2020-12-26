import settings from "~/settings";
import Event from "~/types/IEvent";
import { Guild, Member } from "eris";
import { OldMember, urlRegex } from "~/utils/Utils";

/** Handle muted members trying to re-join the server and users with urls in their name */
export const event: Event = {
    name: "guildMemberUpdate",
    run: async (_, guild: Guild, member: Member, oldMember: OldMember) => {
        if (guild.id !== settings.options.guild) return;
        const hasUrlUsername = member.username.match(urlRegex);
        if (!hasUrlUsername && !oldMember.pending) {
            await member.addRole(settings.options.memberRole, "New member");
        }
    }
};

export default event;
