import { IMessageCollectorOptions } from "~/types/CommandOptions";

declare module "eris" {
    interface Channel {
        awaitMessages(filter: (message: Message) => boolean, options: IMessageCollectorOptions): Promise<Message[]>;
        isGuildChannel: boolean;
        /**
         * @TODO Change all instances of isDMChannel to isPrivateChannel
         * @deprecated Use isPrivateChannel
         */
        isDMChannel: boolean;
        isPrivateChannel: boolean;
    }

    interface User {
        tag: string;
    }

    interface Member {
        tag: string;
    }
}
