import { Document } from "mongoose";

export interface ISuggestion {
    sid: number;
    creator: string;
    creatorId: string;
    content: string;
    messageId: string;
    moderator?: string;
    modId?: string;
    state?: string;
}

export type SuggestionDoc = ISuggestion & Document;
