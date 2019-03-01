const Command = require("../Command");

class Help extends Command {
    constructor() {
        super({
            name: "help",
            description: "send info about the commands",
            usage: "help",
            userPermissions: ["sendMessages"],
            botPermissions: ["readMessages", "sendMessages"]
        });
    }

    async run(msg, args, client, ctx) {
        if (args.length === 0) {
            let messageQueue = [];
            let currentMessage = `\n# Here's a list of my commands. For more info do: ${ctx.config.prefix}help <command>`;
            ctx.commands.forEach((command) => {
                if (command.hidden === true) return;

                let toAdd = `@${command.name}\n` +
                    `   "${command.description}"\n`;
                if (currentMessage.length + toAdd.length >= 1900) { // If too long push to queue and reset it.
                    messageQueue.push(currentMessage);
                    currentMessage = "";
                }
                currentMessage += `\n${toAdd}`;
            });
            messageQueue.push(currentMessage);
            msg.channel.addMessageReaction(msg.id, "✅");
            const dm = await client.getDMChannel(msg.author.id);
            let sendInOrder = setInterval(async () => {
                if (messageQueue.length > 0) {
                    await dm.createMessage(`\`\`\`py${messageQueue.shift()}\`\`\``); // If still messages queued send the next one.
                } else {
                    clearInterval(sendInOrder);
                }
            }, 300);
        } else {
            let cmd = this.checkForMatch(args[0], ctx);
            if (cmd === null) {
                await msg.channel.createMessage(`Command \`${ctx.config.prefix}${args[0]}\` not found`);
            } else {
                const helpMessage = "```asciidoc\n" +
                    `= ${cmd.name} =\n` +
                    `${cmd.description}\n` +
                    "----------\n\n" +
                    `Aliases            ::  ${cmd.aliases.join(", ")}\n` +
                    `Usage              ::  ${ctx.config.prefix}${cmd.usage}\n` +
                    `Guild Only         ::  ${cmd.guildOnly ? "yes" : "no"}\n` +
                    `Owner Only         ::  ${cmd.ownerOnly ? "yes" : "no"}\n` +
                    `Required Args      ::  ${cmd.requiredArgs}\n` +
                    `User Permissions   ::  ${cmd.userPermissions.join(", ")}\n` +
                    `Bot Permissions    ::  ${cmd.botPermissions.join(", ")}\n\n` +
                    "<> = required\n" +
                    "[] = optional\n" +
                    "```";
                await msg.channel.createMessage(helpMessage);
            }
        }
    }

    checkForMatch(name, ctx) {
        if (name.startsWith(ctx.config.prefix)) {
            name = name.substr(1);
        }

        return ctx.commands.find((cmd) => cmd.name === name || cmd.aliases.indexOf(name) !== -1);
    }
}

module.exports = Help;
