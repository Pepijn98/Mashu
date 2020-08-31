import Command from "~/Command";
import { Message } from "eris";

export default class Ping extends Command {
    constructor(category: string) {
        super({
            name: "ping",
            description: "Testing the bot",
            usage: "ping",
            example: "ping",
            category: category
        });
    }

    async run(msg: Message): Promise<void> {
        await msg.channel.createMessage("Pong!");
    }
}
