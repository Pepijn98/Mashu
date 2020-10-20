import settings from "~/settings";
import SuggestionController from "~/controller/SuggestionController";
import Command from "~/Command";
import Mashu from "~/utils/MashuClient";
import { ICommandContext } from "~/types/ICommandContext";
import { ISuggestion } from "~/types/mongo/Suggestions";
import { isGuildChannel } from "~/utils/Utils";
import { Message, TextChannel, EmbedField, EmbedOptions } from "eris";

const suggestionPermission = "manageGuild";
const controller = new SuggestionController();

const colorMap: Record<string, number> = {
    accepted: settings.colors.accepted,
    denied: settings.colors.denied
};

function createSuggestionEmbed(suggestion: ISuggestion, created = false): EmbedOptions {
    const fields: EmbedField[] = [
        {
            name: "id",
            value: String(suggestion.sid),
            inline: true
        },
        {
            name: "state",
            value: suggestion.state || "\u200b",
            inline: true
        }
    ];

    if (suggestion.state !== "created" && suggestion.modId) {
        fields.push({ name: "Mod", value: suggestion.moderator || "" });
    }

    fields.push({ name: "Content", value: `\`\`\`${suggestion.content.substring(0, 1000)}\`\`\`` });

    if (suggestion.content.length > 1000) {
        fields.push({ name: "--------", value: `\`\`\`${suggestion.content.substring(1000, 2000)}\`\`\`` });
    }

    return {
        title: `${created ? "New " : ""}Suggestion by ${suggestion.creator}(${suggestion.creatorId})`,
        color: colorMap[suggestion.state] || settings.colors.default,
        fields
    };
}

function createSuggestionListEmbed(suggestions: ISuggestion[], page: number, maxPage: number): EmbedOptions {
    const fields: EmbedField[] = [];

    for (const suggestion of suggestions) {
        fields.push({
            name: `Suggestion ${suggestion.sid}`,
            value:
                "```\n" +
                `id: ${suggestion.sid}\n` +
                `Made by: ${suggestion.creator}(${suggestion.creatorId})\n` +
                `State: ${suggestion.state}${suggestion.state !== "created" ? `\nMod: ${suggestion.moderator}` : ""}\`\`\``
        });
    }

    return {
        title: `Suggestion list Page ${page}/${maxPage}`,
        color: 120564,
        fields
    };
}

function parseNumber(number: string): number {
    const parsedNumber = parseInt(number);
    if (isNaN(parsedNumber)) {
        throw new Error("Not a number");
    }
    return parsedNumber;
}

async function acceptOrDenySuggestion(client: Mashu, msg: Message, args: string[], type: "accept" | "deny"): Promise<void> {
    if (msg.member && !msg.member.permission.has(suggestionPermission)) {
        await msg.channel.createMessage(`Only mods with the permission \`${suggestionPermission}\` can use this command`);
        return;
    }

    if (!isGuildChannel(msg.channel)) {
        await msg.channel.createMessage("This can only be used in a guild");
        return;
    }

    let id = 0;
    try {
        id = parseNumber(args[0]);
    } catch (e) {
        await msg.channel.createMessage("Please use a numeric id");
        return;
    }

    let suggestion = await controller.getSuggestion(id);
    if (!suggestion) {
        await msg.channel.createMessage(`Suggestion with id ${id} could not be found`);
        return;
    }

    if (type === "accept") {
        await controller.acceptSuggestion(client, msg.author, suggestion.sid);
    } else {
        await controller.declineSuggestion(client, msg.author, suggestion.sid);
    }

    suggestion = await controller.getSuggestion(id);
    try {
        if (!settings.options.suggestionChannel) {
            await msg.channel.createMessage("No suggestion channel specified in the settings!");
            return;
        }

        const notificationChannel = msg.channel.guild.channels.get(settings.options.suggestionChannel) as TextChannel;
        if (notificationChannel && suggestion) {
            const notificationMessage = await notificationChannel.getMessage(suggestion.messageId);
            if (notificationMessage) {
                await notificationMessage.edit({ content: "", embed: createSuggestionEmbed(suggestion) });
            }
        }
    } catch (e) {
        console.error(e);
    }

    await msg.channel.createMessage(`Successfully ${type === "accept" ? "accepted" : "denied"} suggestion ${suggestion ? suggestion.sid : "Unknown"}`);
    return;
}

export default class Suggestion extends Command {
    constructor(category: string) {
        super({
            name: "suggestion",
            description: "Create, show, list, accept and deny suggestions",
            usage: "suggestion <action: string> [...rest: string[]]",
            example: "suggestion create This is a new suggestion, I like to have more cargirls",
            subCommands: ["create", "show", "list", "accept", "deny"],
            category: category,
            guildOnly: true,
            requiredArgs: 1,
            userPermissions: ["sendMessages"],
            botPermissions: ["readMessages", "sendMessages"]
        });
    }

    async run(msg: Message, args: string[], { client }: ICommandContext): Promise<void> {
        if (!isGuildChannel(msg.channel)) {
            await msg.channel.createMessage("This can only be used in a guild");
            return;
        }

        if (!settings.options.suggestionChannel) {
            await msg.channel.createMessage("No suggestion channel specified in the settings!");
            return;
        }

        const action = args.shift();
        if (args.length >= 1) {
            switch (action) {
                case "create": {
                    if (args.length < 1) {
                        await msg.channel.createMessage("Oops, it seems like you did not add a suggestion");
                        return;
                    }

                    const content = args.join(" ");
                    const notificationMessage = await client.createMessage(settings.options.suggestionChannel, `New Suggestion by ${msg.author.tag}`);
                    const suggestion = await controller.createSuggestion(content, msg.author, notificationMessage.id);
                    await notificationMessage.edit({ content: "", embed: createSuggestionEmbed(suggestion!, true) });
                    await notificationMessage.addReaction("👍");
                    await notificationMessage.addReaction("👎");
                    await msg.channel.createMessage(`Your suggestion was created successfully and has the id: **${suggestion!.sid}**`);
                    return;
                }
                case "show": {
                    if (msg.member && !msg.member.permission.has(suggestionPermission)) {
                        await msg.channel.createMessage("You are not allowed to use this command");
                        return;
                    }

                    if (args.length < 1) {
                        await msg.channel.createMessage("You have to add the id of the suggestion you want to see, alternatively use list to get a list of suggestions");
                        return;
                    }

                    let id = 0;
                    try {
                        id = parseNumber(args[0]);
                    } catch (e) {
                        await msg.channel.createMessage("Please use a numeric id");
                        return;
                    }

                    const suggestion = await controller.getSuggestion(id);
                    if (!suggestion) {
                        await msg.channel.createMessage(`Suggestion with id ${id} could not be found`);
                        return;
                    }

                    await msg.channel.createMessage({ embed: createSuggestionEmbed(suggestion) });
                    return;
                }
                case "list": {
                    if (msg.member && !msg.member.permission.has(suggestionPermission)) {
                        await msg.channel.createMessage("You are not allowed to use this command");
                        return;
                    }

                    let page = 1;
                    if (args.length === 1) {
                        try {
                            page = parseNumber(args[0]);
                        } catch (e) {
                            page = 0;
                        }
                    }

                    const maxPage = await controller.maxSuggestionPage();
                    if (page > maxPage) {
                        await msg.channel.createMessage("This page does not exist");
                        return;
                    }

                    const suggestions = await controller.listSuggestion(page);
                    await msg.channel.createMessage({ embed: createSuggestionListEmbed(suggestions, page, maxPage) });
                    return;
                }
                case "accept": {
                    return await acceptOrDenySuggestion(client, msg, args, "accept");
                }
                case "deny": {
                    return await acceptOrDenySuggestion(client, msg, args, "deny");
                }
                default:
                    await msg.channel.createMessage(
                        "**Commands**\n" +
                            "You can either **create** a sugestion\n" +
                            "Get a **list** of the newest suggestions\n" +
                            "**View** a suggestion by **id**\n" +
                            "**Accept** a suggestion by **id**\n" +
                            "**Deny** a suggestion by **id**"
                    );
                    return;
            }
        } else {
            await msg.channel.createMessage(`Missing argument for action **${action}**`);
        }
    }
}
