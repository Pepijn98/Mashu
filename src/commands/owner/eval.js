const Command = require("../../Command");

class Eval extends Command {
    constructor() {
        super({
            name: "eval",
            description: "Evaluate javascript code",
            usage: "eval <code: string>",
            category: "owner",
            ownerOnly: true,
            requiredArgs: 1
        });
    }

    async run(msg, args, client, ctx) {
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

module.exports = Eval;
