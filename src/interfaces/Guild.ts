export interface IViolation {
    id: string;
    timestamp: string;
    by: string;
    reason: string;
}

export interface INote {
    id: string;
    timestamp: string;
    by: string;
    message: string;
}

export interface IUser {
    id: string;
    isBanned: boolean;
    isMuted: boolean;
    warns: IViolation[];
    bans: IViolation[];
    kicks: IViolation[];
    notes: INote[];
}

export interface ISuggestion {
    id: number;
    creator: string;
    creatorId: string;
    content: string;
    notificationId: string;
    moderator?: string;
    modId?: string;
    state?: string;
}

export interface IGuild {
    gid: string;
    logChannel: string;
    suggestionChannel: string;
    notifyCreator: boolean;
    muteRole: string;
    users: IUser[];
    suggestions: ISuggestion[];
}
