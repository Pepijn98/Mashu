import Collection from "@kurozero/collection";
import { User } from "eris";
import { Permission } from "~/utils/Utils";

export interface ICommandOptions {
    name: string;
    description: string;
    usage: string;
    example: string;
    subCommands?: string[] | null;
    category?: string | null;
    aliases?: string[] | null;
    hidden?: boolean | null;
    guildOnly?: boolean | null;
    ownerOnly?: boolean | null;
    requiredArgs?: number | null;
    userPermissions?: Permission[] | null;
    botPermissions?: Permission[] | null;
}

export interface IMessageCollectorOptions {
    time: number;
    maxMatches: number;
}

export interface ICommandStats {
    commandsExecuted: number;
    messagesSeen: number;
    commandUsage: {
        [x: string]: {
            size: number;
            users: Collection<User>;
        };
    };
}
