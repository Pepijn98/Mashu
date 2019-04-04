const GuildModel = require("../utils/Mongoose");

class SuggestionController {
    /**
     * Create a new Suggestion
     * @param content - Content of the suggestion
     * @param creator - User object of the creator of the Suggestion
     * @param notificationId - Id of the notification message sent to discord
     * @returns {Promise}
     */
    async createSuggestion(content, creator, guildId, notificationId) {
        const guild = await GuildModel.findOne({ "id": guildId }).exec();
        const currentAmount = await guild.suggestions.length;
        const suggestion = {
            id: currentAmount + 1,
            creator: `${creator.username}#${creator.discriminator}`,
            creatorId: creator.id,
            moderator: "",
            modId: "",
            state: "created",
            content,
            notificationId
        };

        guild.suggestions.push(suggestion);
        guild.save();

        return suggestion;
    }

    /**
     * Get a suggestion via id
     * @param id - Id of the suggestion
     * @returns {Promise}
     */
    async getSuggestion(guildId, id) {
        const guild = await GuildModel.findOne({ "id": guildId }).exec();
        return guild.suggestions.find((s) => s.id === id);
    }

    /**
     * Accept a suggestion
     * @param id - id of the suggestion
     * @param moderator - User Object of the moderator that accepted this suggestion
     * @returns {Promise}
     */
    async acceptSuggestion(guildId, id, moderator) {
        return this.updateSuggestionState(guildId, id, moderator, "accept");
    }

    /**
     * Decline a suggestion
     * @param id - id of the suggestion
     * @param moderator - User Object of the moderator that declined the suggestion
     * @returns {Promise}
     */
    async declineSuggestion(guildId, id, moderator) {
        return this.updateSuggestionState(guildId, id, moderator, "deny");
    }

    /**
     * Updates the state and the moderator of a suggestion
     * @param id - id of the suggestion
     * @param moderator - the User Object of the moderator that changed the state of the suggestion
     * @param state - the new State, could be either accept or deny
     * @returns {Promise}
     */
    async updateSuggestionState(guildId, id, moderator, state) {
        const guild = await GuildModel.findOne({ "id": guildId }).exec();
        const suggestion = await this.getSuggestion(guildId, id);
        suggestion.modId = moderator.id;
        suggestion.moderator = `${moderator.username}#${moderator.discriminator}`;
        suggestion.state = state;
        guild.save();
        return suggestion;
    }

    /**
     * Get a list of suggestions paginated in 10 result batches
     * @param page - The page to load (pages start at 0)
     * @returns {Promise}
     */
    async listSuggestion(guildId, page = 0) {
        const guild = await GuildModel.findOne({ "id": guildId }).exec();
        return Array.from(guild.suggestions).paginate(2, page);
    }

    /**
     * Get the amount of pages that are currently available
     * @returns {Promise}
     */
    async maxSuggestionPage(guildId) {
        const guild = await GuildModel.findOne({ "id": guildId }).exec();
        const suggestionCount = guild.suggestions.length;
        return Math.ceil(suggestionCount / 10);
    }
}

module.exports = SuggestionController;
