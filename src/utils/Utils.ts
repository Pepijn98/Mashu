import Counters from "~/models/Counters";
import settings from "~/settings";
import Mashu from "./MashuClient";
import { Channel, Guild, GuildChannel, PrivateChannel, TextChannel } from "eris";

export const urlRegex = /[-a-zA-Z0-9@:%_+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_+.~#?&//=]*)?/gui;

/** Wait x amount of milliseconds */
export const sleep = (ms: number): Promise<unknown> => new Promise((r) => setTimeout(r, ms));

/** Check whether channel is guild channel */
export const isGuildChannel = (channel: Channel): channel is GuildChannel => {
    if (channel instanceof GuildChannel) return true;
    return false;
};

export const isGuildTextChannel = (channel: Channel): channel is TextChannel => {
    if (channel instanceof TextChannel) return true;
    return false;
};

/** Check whether channel is DM channel */
export const isPrivateChannel = (channel: Channel): channel is PrivateChannel => {
    if (channel instanceof PrivateChannel) return true;
    return false;
};

/** Convert seconds to human readable form */
export const formatSeconds = (time: number): string => {
    let days = Math.floor((time % 31536000) / 86400);
    let hours = Math.floor(((time % 31536000) % 86400) / 3600);
    let minutes = Math.floor((((time % 31536000) % 86400) % 3600) / 60);
    let seconds = Math.round((((time % 31536000) % 86400) % 3600) % 60);
    days = days > 9 ? days : days;
    hours = hours > 9 ? hours : hours;
    minutes = minutes > 9 ? minutes : minutes;
    seconds = seconds > 9 ? seconds : seconds;
    return `${days} Days, ${hours} Hours, ${minutes} Minutes and ${seconds} Seconds`;
};

export const round = (value: number, precision: number): number => {
    const multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
};

export const getNextSequenceValue = async (name: string): Promise<number> => {
    const sequence = await Counters.findOneAndUpdate({ _id: name }, { $inc: { sequence_value: 1 } }).exec();
    if (sequence) {
        return sequence.sequence_value;
    }
    throw Error(`No counter found with name ${name}`);
};

export const updateMemberCount = async (client: Mashu, guild: Guild): Promise<void> => {
    if (!settings.options.memberCountChannel) return;
    const channel = guild.channels.get(settings.options.memberCountChannel);
    if (channel) {
        try {
            await channel.edit({
                name: `🐺 Members - ${guild.memberCount}`
            });
            // client.logger.info("MEMBER_COUNT", guild.memberCount.toString());
        } catch (e) {
            client.logger.error("MEMBER_COUNT", e);
        }
    }
};
