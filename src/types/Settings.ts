export interface IColors {
    default: number;
    error: number;
    ban: number;
    unban: number;
    warn: number;
    kick: number;
    mute: number;
    unmute: number;
    accepted: number;
    denied: number;
}

export interface IDatabase {
    host: string;
    port: number;
    name: string;
    user: string;
    pwd: string;
}

export interface IOptions {
    guild: string;
    muteRole: string;
    logChannel: string;
    suggestionChannel: string;
    notifyCreator: boolean;
}

export interface ISettings {
    token: string;
    owner: string;
    prefix: string;
    colors: IColors;
    database: IDatabase;
    options: IOptions;
}
