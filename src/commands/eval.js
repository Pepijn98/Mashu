const Command = require("../Command");

class Eval extends Command {
    constructor() {
        super({
            name: "eval",
            description: "Evaluate javascript code",
            usage: "eval <code: string>",
            ownerOnly: true,
            userPermissions: ["sendMessages"],
            botPermissions: ["readMessages", "sendMessages"]
        });
    }

    async run(msg, _args, _client, ctx) {
        console.debug(`[EVAL] ${msg.author.username}: ${msg.content}`);

        let toEval = msg.content.replace(`${ctx.config.prefix}eval`, "").trim();
        let result = "~eval failed~";

        console.log(toEval);

        try {
            result = eval(toEval);
            result = result.replace(new RegExp(`${ctx.config.token}`, "giu"), "<token-redacted>");
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
