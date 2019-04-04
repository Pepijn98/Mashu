const SuggestionController = require("../../controller/SuggestionController");
const Command = require("../../Command");

const suggestionModPermission = "manageMessages";

const suggestionController = new SuggestionController();
const createSuggestionEmbed = (suggestion, created = false) => {
    let fields = [
        { name: "id", value: suggestion.id, inline: true },
        { name: "state", value: suggestion.state, inline: true }
    ];
    if (suggestion.state !== "created") {
        if (suggestion.modId) {
            fields.push({ name: "Mod", value: suggestion.moderator });
        }
    }
    fields.push({ name: "Content", value: `\`\`\`${suggestion.content.substring(0, 1000)}\`\`\`` });
    if (suggestion.content.length > 1000) {
        fields.push({ name: "--------", value: `\`\`\`${suggestion.content.substring(1000, 2000)}\`\`\`` });
    }
    return {
        title: `${created ? "New " : ""}Suggestion by ${suggestion.creator}(${suggestion.creatorId})`,
        color: 120564,
        fields
    };
};

const createSuggestionListEmbed = (suggestions, page, maxPage) => {
    let fields = [];
    for (let suggestion of suggestions) {
        fields.push({
            name: `Suggestion ${suggestion.id}`,
            value: "```\n" +
                `id: ${suggestion.id}\n` +
                `Made by: ${suggestion.creator}(${suggestion.creatorId})\n` +
                `State: ${suggestion.state}${suggestion.state !== "created" ? `\nMod: ${suggestion.moderator}` : ""}\`\`\``
        });
    }
    return {
        title: `Suggestion list Page ${page}/${maxPage}`,
        color: 120564,
        fields
    };
};
const parseNumber = (number) => {
    let parsedNumber = parseInt(number); // eslint-disable-line radix
    if (isNaN(parsedNumber)) {
        throw new Error("Not a number");
    }
    return parsedNumber;
};

const acceptOrDenySuggestion = async (msg, db, msgSplit, type) => {
    if (!msg.member.permission.has(suggestionModPermission))
        return await msg.channel.createMessage("Only mods with the permission `manageMessages` can use this command");
    if (msgSplit.length === 3)
        return await msg.channel.createMessage("You have to add the id of the suggestion you want to accept, alternatively use list to get a list of suggestions");

    let id = 0;
    try {
        id = parseNumber(msgSplit[3]);
    } catch (e) {
        return await msg.channel.createMessage("Please use a numeric id.");
    }

    let suggestion = await suggestionController.getSuggestion(msg.channel.guild.id, id);
    if (!suggestion)
        return await msg.channel.createMessage(`Suggestion with id ${id} could not be found`);

    if (type === "accept") {
        await suggestionController.acceptSuggestion(msg.channel.guild.id, suggestion.id, msg.author);
    } else {
        await suggestionController.declineSuggestion(msg.channel.guild.id, suggestion.id, msg.author);
    }
    suggestion = await suggestionController.getSuggestion(msg.channel.guild.id, id);
    try {
        const guild = await db.guild.findOne({ "id": msg.channel.guild.id }).exec();
        if (!guild || !guild.suggestionChannel)
            return await msg.channel.createMessage("Please use the setup command before using suggestions");
        const notificationChannel = msg.channel.guild.channels.get(guild.suggestionChannel);
        if (notificationChannel) {
            const notificationMessage = await notificationChannel.getMessage(suggestion.notificationId);
            if (notificationMessage) {
                await notificationMessage.edit({ content: "", embed: createSuggestionEmbed(suggestion) });
            }
        }
    } catch (e) {
        console.error(e);
    }
    return await msg.channel.createMessage(`Successfully ${type === "accept" ? "accepted" : "denied"} suggestion ${suggestion.id}`);
};

class Suggestion extends Command {
    constructor(category) {
        super({
            name: "suggestion",
            description: "",
            category: category,
            guildOnly: true,
            requiredArgs: 1,
            userPermissions: ["sendMessages"],
            botPermissions: ["readMessages", "sendMessages"]
        });
    }

    async run(msg, args, client, { database }) {
        // if (args.length === 1)
        //     return await msg.channel.createMessage("**Commands**\nYou can either **create** a sugestion\nGet a **list** of the newest suggestions\n**View** a suggestion by **id**\n**Accept** a suggestion by **id**\n**Deny** a suggestion by **id**");

        const guild = await database.guild.findOne({ "id": msg.channel.guild.id }).exec();
        if (!guild || !guild.suggestionChannel)
            return await msg.channel.createMessage("Please use the setup command before using suggestions");

        if (args.length >= 1) {
            switch (args[0]) {
                case "create": {
                    if (args.length === 1)
                        return await msg.channel.createMessage("Oops, it seems like you did not add a Suggestion");
                    let content = args.splice(1).join(" ");
                    let notificationMessage = await client.createMessage(guild.suggestionChannel, `New Suggestion by ${msg.author.username}#${msg.author.discriminator}`);
                    let suggestion = await suggestionController.createSuggestion(content, msg.author, msg.channel.guild.id, notificationMessage.id);
                    await notificationMessage.edit({ content: "", embed: createSuggestionEmbed(suggestion, true) });
                    return await msg.channel.createMessage(`Your suggestion was created successfully and has the id: **${suggestion.id}**`);
                }
                case "show": {
                    if (args.length === 1)
                        return await msg.channel.createMessage("You have to add the id of the suggestion you want to see, alternatively use list to get a list of suggestions");
                    if (!msg.member.permission.has(suggestionModPermission))
                        return await msg.channel.createMessage("You are not allowed to use this command");

                    let id = 0;
                    try {
                        id = parseNumber(args[3]);
                    } catch (e) {
                        return await msg.channel.createMessage("Please use a numeric id.");
                    }

                    let suggestion = await suggestionController.getSuggestion(msg.channel.guild.id, id);
                    if (!suggestion)
                        return await msg.channel.createMessage(`Suggestion with id ${id} could not be found`);

                    return await msg.channel.createMessage({ embed: createSuggestionEmbed(suggestion) });
                }
                case "list": {
                    if (!msg.member.permission.has(suggestionModPermission))
                        return await msg.channel.createMessage("You are not allowed to use this command");

                    let page = 1;
                    if (args.length === 2) {
                        try {
                            page = parseInt(args[1]); // eslint-disable-line radix
                        } catch (e) {
                            page = 0;
                        }
                    }

                    let maxPage = await suggestionController.maxSuggestionPage(msg.channel.guild.id);
                    if (page > maxPage) return await msg.channel.createMessage("This page does not exist.");
                    let suggestions = await suggestionController.listSuggestion(msg.channel.guild.id);
                    return await msg.channel.createMessage({ embed: createSuggestionListEmbed(suggestions, page, maxPage) });
                }
                case "accept": {
                    return await acceptOrDenySuggestion(msg, database, args, "accept");
                }
                case "deny": {
                    return await acceptOrDenySuggestion(msg, database, args, "deny");
                }
                default:
                    return await msg.channel.createMessage("**Commands**\nYou can either **create** a sugestion\nGet a **list** of the newest suggestions\n**View** a suggestion by **id**\n**Accept** a suggestion by **id**\n**Deny** a suggestion by **id**");
            }
        }
    }
}

module.exports = Suggestion;
