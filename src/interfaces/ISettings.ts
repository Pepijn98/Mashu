export interface IColors {
    default: number;
    error: number;
    ban: number;
    unban: number;
    warn: number;
    kick: number;
    mute: number;
    unmute: number;
}

export interface IDatabase {
    host: string;
    port: number;
    name: string;
}

export interface ISettings {
    token: string;
    owner: string;
    prefix: string;
    colors: IColors;
    database: IDatabase;
}
