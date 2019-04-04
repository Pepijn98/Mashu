const GuildModel = require("../utils/Mongoose");

class SuggestionController {
    /**
     * Create a new Suggestion
     * @param {string} content - Content of the suggestion
     * @param {User} creator - User object of the creator of the Suggestion
     * @param {string} guildId - The id of the guild the suggestion was created in
     * @param {number} notificationId - Id of the notification message sent to discord
     * @returns {Promise}
     */
    async createSuggestion(content, creator, guildId, notificationId) {
        const guild = await GuildModel.findOne({ "id": guildId }).exec();
        const currentAmount = await guild.suggestions.length;
        const suggestion = {
            id: currentAmount + 1,
            creator: `${creator.username}#${creator.discriminator}`,
            creatorId: creator.id,
            content,
            notificationId
        };

        guild.suggestions.push(suggestion);
        await guild.save();

        return await this.getSuggestion(guildId, suggestion.id);
    }

    /**
     * Get a suggestion via id
     *
     * @param {string} guildId - The id of the guild the suggestion was created in
     * @param {number} id - Id of the suggestion
     * @returns {Promise}
     */
    async getSuggestion(guildId, id) {
        const guild = await GuildModel.findOne({ "id": guildId }).exec();
        return guild.suggestions.find((s) => s.id === id);
    }

    /**
     * Accept a suggestion
     *
     * @param {string} guildId - The id of the guild the suggestion was created in
     * @param {number} id - id of the suggestion
     * @param {User} moderator - User Object of the moderator that accepted this suggestion
     * @returns {Promise}
     */
    async acceptSuggestion(guildId, id, moderator, client) {
        const guild = await GuildModel.findOne({ "id": guildId }).exec();
        const accepted = await this.updateSuggestionState(guild, id, moderator, "accepted");
        if (guild.notifyCreator) {
            const dm = await client.getDMChannel(accepted.creatorId);
            dm.createMessage(`Hello ${accepted.creator},\n` +
                "Your suggestion has been accepted!\n" +
                `\`\`\`${accepted.content}\`\`\``);
        }
        return accepted;
    }

    /**
     * Decline a suggestion
     *
     * @param {string} guildId - The id of the guild the suggestion was created in
     * @param {number} id - id of the suggestion
     * @param {User} moderator - User Object of the moderator that declined the suggestion
     * @returns {Promise}
     */
    async declineSuggestion(guildId, id, moderator, client) {
        const guild = await GuildModel.findOne({ "id": guildId }).exec();
        const denied = await this.updateSuggestionState(guild, id, moderator, "denied");
        if (guild.notifyCreator) {
            const dm = await client.getDMChannel(denied.creatorId);
            dm.createMessage(`Hello ${denied.creator},\n` +
                "Your suggestion has been denied.\n" +
                `\`\`\`${denied.content}\`\`\`\n`);
        }
        return denied;
    }

    /**
     * Updates the state and the moderator of a suggestion
     *
     * @param {Guild} guild - The guild the suggestion was created in
     * @param {number} id - id of the suggestion
     * @param {User} moderator - the User Object of the moderator that changed the state of the suggestion
     * @param {string} state - the new State, could be either accept or deny
     * @returns {Promise}
     */
    async updateSuggestionState(guild, id, moderator, state) {
        guild.suggestions.map((s) => {
            if (s.id === id) {
                s.modId = moderator.id;
                s.moderator = `${moderator.username}#${moderator.discriminator}`;
                s.state = state;
            }
            return s;
        });
        await guild.save();
        return await this.getSuggestion(guild.id, id);
    }

    /**
     * Get a list of suggestions paginated in 10 result batches
     *
     * @param {string} guildId - The id of the guild the suggestion was created in
     * @param {number} page - The page to load (pages start at 0)
     * @returns {Promise}
     */
    async listSuggestion(guildId, page = 0) {
        const guild = await GuildModel.findOne({ "id": guildId }).exec();
        return Array.from(guild.suggestions).paginate(4, page);
    }

    /**
     * Get the amount of pages that are currently available
     *
     * @param {string} guildId - The id of the guild the suggestion was created in
     * @returns {Promise}
     */
    async maxSuggestionPage(guildId) {
        const guild = await GuildModel.findOne({ "id": guildId }).exec();
        const suggestionCount = guild.suggestions.length;
        return Math.ceil(suggestionCount / 4);
    }
}

module.exports = SuggestionController;
