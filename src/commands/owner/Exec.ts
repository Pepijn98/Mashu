import Command from "../../Command";
import { exec } from "child_process";
import { Message } from "eris";

export default class Exec extends Command {
    public constructor(category: string) {
        super({
            name: "exec",
            description: "Execute shell shit",
            usage: "exec <command: string>",
            example: "exec pm2 list",
            category: category,
            ownerOnly: true,
            requiredArgs: 1
        });
    }

    public async run(msg: Message, args: string[]): Promise<void> {
        exec(args.join(" "), { maxBuffer: Infinity }, async (err, stdout, stderr) => {
            try {
                if (err) return await msg.channel.createMessage(`\`\`\`fix\n${err}\n\`\`\``);
                if (stderr) return await msg.channel.createMessage(`\n\`\`\`fix\n${stderr}\n\`\`\``);
                await msg.channel.createMessage(`\`\`\`fix\n${stdout}\n\`\`\``);
            } catch (e) {
                msg.channel.createMessage(`\`\`\`${e.toString()}\`\`\``).catch(() => null);
            }
        });
    }
}
