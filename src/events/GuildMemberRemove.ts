import settings from "~/settings";
import Event from "~/types/IEvent";
import { Guild, Member } from "eris";
import { updateMemberCount, urlRegex } from "~/utils/Utils";

/** Update member count channel */
export const event: Event = {
    name: "guildMemberRemove",
    run: async (client, guild: Guild, member: Member) => {
        if (guild.id !== settings.options.guild) return;
        const hasUrlUsername = member.username.match(urlRegex);
        if (hasUrlUsername) return;
        await updateMemberCount(client, guild);
    }
};

export default event;
