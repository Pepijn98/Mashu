import settings from "~/settings";
import Event from "~/types/IEvent";
import { Channel } from "eris";
import { isGuildTextChannel, isGuildVoiceChannel, textMute, voiceMute } from "~/utils/Utils";

/** When new channel is created and the guild has a muted role, add the muted role */
export const event: Event = {
    name: "channelCreate",
    run: async (client, channel: Channel) => {
        if (!settings.options.muteRole) return;

        if (isGuildTextChannel(channel)) {
            client.logger.debug("CHANNEL_CREATE", `[${channel.name}] (${channel.id}) {${textMute}} | Add mute overrides to new channel`);
            await channel.editPermission(settings.options.muteRole, 0, textMute, "role", "Add mute overrides to new channel");
        }

        if (isGuildVoiceChannel(channel)) {
            client.logger.debug("CHANNEL_CREATE", `[${channel.name}] (${channel.id}) {${voiceMute}} | Add mute overrides to new channel`);
            await channel.editPermission(settings.options.muteRole, 0, voiceMute, "role", "Add mute overrides to new channel");
        }
    }
};

export default event;
