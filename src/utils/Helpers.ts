import { AnyChannel } from "eris";

export const sleep = (ms: number): Promise<unknown> => new Promise((r) => setTimeout(r, ms));

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
