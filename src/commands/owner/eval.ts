import Command from "../../Command";
import Mashu from "../../utils/MashuClient";
import { ICommandContext } from "../../interfaces/ICommandContext";
import { Message } from "eris";

export default class Eval extends Command {
    public constructor(category: string) {
        super({
            name: "eval",
            description: "Evaluate javascript code",
            usage: "eval <code: string>",
            category: category,
            ownerOnly: true,
            requiredArgs: 1
        });
    }

    public async run(msg: Message, _args: string[], _client: Mashu, ctx: ICommandContext): Promise<void> {
        ctx.logger.info("EVAL", `${msg.author.username}: ${msg.content}`);

        let toEval = msg.content.replace(`${ctx.settings.prefix}eval`, "").trim();
        let result = "~eval failed~";
        try {
            result = await eval(toEval);
            result = result ? result.toString().replace(new RegExp(`${ctx.settings.token}`, "giu"), "<token-redacted>") : "Empty Result";
        } catch (error) {
            ctx.logger.info("EVAL FAILED", `${error.toString()}`);
            msg.channel.createMessage(`\`\`\`diff\n- ${error}\`\`\``);
        }

        if (result !== "~eval failed~") {
            ctx.logger.info("EVAL RESULT", `${result}`);
            msg.channel.createMessage(`__**Result:**__ \n${result}`);
        }
    }
}
