import { Message } from "eris";

export interface IReactionButton {
    emoji: string;
    type: string;
}

export interface IActiveMessage {
    reactionButtons: IReactionButton[];
    reactionButtonTimeout: number;
    messageQueue: string[];
    queueIndex: number;
    self: Message;
    timeout: NodeJS.Timeout;
}
