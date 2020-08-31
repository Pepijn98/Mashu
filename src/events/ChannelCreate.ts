import settings from "~/settings";
import { IEvent } from "~/types/IEvent";
import { isGuildChannel } from "~/utils/Utils";
import { Channel } from "eris";

/** When new channel is created and the guild has a muted role, add the muted role */
export const event: IEvent = {
    name: "channelCreate",
    run: async (_client, _settings, channel: Channel) => {
        if (isGuildChannel(channel) && settings.options.muteRole) {
            await channel.editPermission(settings.options.muteRole, 0, 55360, "role", "Create muted overrides");
        }
    }
};
