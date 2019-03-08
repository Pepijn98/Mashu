const Command = require("../Command");

class Eval extends Command {
    constructor() {
        super({
            name: "eval",
            description: "Evaluate javascript code",
            usage: "eval <code: string>",
            ownerOnly: true,
            requiredArgs: 1
        });
    }

    async run(msg, args, client, ctx) {
        console.debug(`[EVAL] ${msg.author.username}: ${msg.content}`);

        let toEval = msg.content.replace(`${ctx.config.prefix}eval`, "").trim();
        let result = "~eval failed~";
        try {
            result = await eval(toEval);
            result = result ? result.toString().replace(new RegExp(`${ctx.config.token}`, "giu"), "<token-redacted>") : "Empty Result";
        } catch (error) {
            console.debug(`[EVAL FAILED] ${error.message}`);
            msg.channel.createMessage(`\`\`\`diff\n- ${error}\`\`\``);
        }

        if (result !== "~eval failed~") {
            console.debug(`[EVAL RESULT] ${result}`);
            msg.channel.createMessage(`__**Result:**__ \n${result}`);
        }
    }
}

module.exports = Eval;
