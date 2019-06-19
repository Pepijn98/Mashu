import { IMessageCollectorOptions } from "../../interfaces/Options";

declare module "eris" {
    interface Channel {
        awaitMessages(filter: (message: Message) => boolean, options: IMessageCollectorOptions): Promise<any>;
    }

    interface User {
        tag: string;
    }

    interface Member {
        tag: string;
    }
}
