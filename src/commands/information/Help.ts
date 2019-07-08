import Command from "../../Command";
import Mashu from "../../structures/MashuClient";
import { Message } from "eris";
import { ICommandContext } from "../../interfaces/ICommandContext";

export default class Help extends Command {
    public constructor(category: string) {
        super({
            name: "help",
            description: "send info about the commands",
            usage: "help [command: string]",
            example: "help ping",
            category: category
        });
    }

    public async run(msg: Message, args: string[], client: Mashu, ctx: ICommandContext): Promise<Message | undefined> {
        if (args.length === 0) {
            let messageQueue: string[] = [];
            let currentMessage = `\n# Here's a list of my commands. For more info do: ${ctx.settings.prefix}help <command>\n# Prefix: ${ctx.settings.prefix}\n`;
            client.commands.forEach((command) => {
                if (command.hidden === true) return; // Command is hidden
                if (command.ownerOnly && msg.author.id !== ctx.settings.owner) return; // Command can only be viewed by the owner

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
            const command = this.checkForMatch(args[0], client, ctx);
            if (!command) return await msg.channel.createMessage(`Command \`${ctx.settings.prefix}${args[0]}\` not found`);

            if (command.hidden === true) return; // Command is hidden
            if (command.ownerOnly && msg.author.id !== ctx.settings.owner) {
                return await msg.channel.createMessage("This command can only be viewed and used by the owner.");
            }

            const helpMessage = "```asciidoc\n" +
                `[${command.name.capitalize()}]\n\n` +
                `= ${command.description} =\n\n` +
                `Category           ::  ${command.category}\n` +
                `Aliases            ::  ${command.aliases.join(", ")}\n` +
                `Usage              ::  ${ctx.settings.prefix}${command.usage}\n` +
                `Example            ::  ${command.example}\n` +
                `Sub Commands       ::  ${command.subCommands.join(", ")}\n` +
                `Hidden             ::  ${command.hidden ? "yes" : "no"}\n` +
                `Guild Only         ::  ${command.guildOnly ? "yes" : "no"}\n` +
                `Owner Only         ::  ${command.ownerOnly ? "yes" : "no"}\n` +
                `Required Args      ::  ${command.requiredArgs}\n` +
                `User Permissions   ::  ${command.userPermissions.join(", ")}\n` +
                `Bot Permissions    ::  ${command.botPermissions.join(", ")}\n\n` +
                "<> = required\n" +
                "[] = optional\n" +
                "```";
            await msg.channel.createMessage(helpMessage);
        }
    }

    public checkForMatch(name: string, client: Mashu, ctx: ICommandContext): Command | undefined {
        if (name.startsWith(ctx.settings.prefix)) {
            name = name.substr(1);
        }

        return client.commands.find((cmd) => cmd.name === name || cmd.aliases.indexOf(name) !== -1);
    }
}
