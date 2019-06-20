import { AnyChannel } from "eris";

/** Wait x amount of milliseconds */
export const sleep = (ms: number): Promise<unknown> => new Promise((r) => setTimeout(r, ms));

/** Check whether channel is guild channel */
export const isGuildChannel = (channel: AnyChannel): boolean => {
    switch (channel.type) {
        case 0: return true; // TextChannel
        case 2: return true; // VoiceChannel
        case 4: return true; // CategoryChannel
        case 5: return true; // NewsChannel
        case 6: return true; // StoreChannel
        default: return false;
    }
};
