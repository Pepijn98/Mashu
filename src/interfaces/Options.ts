import Mashu from "../utils/MashuClient";
import Logger from "../utils/Logger";
import { ISettings } from "./ISettings.ts";

export interface ICommandHandlerOptions {
    settings: ISettings;
    client: Mashu;
    logger: Logger;
}

export interface ICommandOptions {
    name: string;
    description: string;
    usage: string;
    category?: string | null;
    aliases?: string[] | null;
    guildOnly?: boolean | null;
    ownerOnly?: boolean | null;
    requiredArgs?: number | null;
    userPermissions?: string[] | null;
    botPermissions?: string[] | null;
}

export interface IMessageCollectorOptions {
    time: number;
    maxMatches: number;
}
