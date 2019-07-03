import Command from "../../Command";
import { Message } from "eris";

export default class Ping extends Command {
    public constructor(category: string) {
        super({
            name: "ping",
            description: "Testing the bot",
            usage: "ping",
            example: "ping",
            category: category
        });
    }

    public async run(msg: Message): Promise<void> {
        await msg.channel.createMessage("Pong!");
    }
}
