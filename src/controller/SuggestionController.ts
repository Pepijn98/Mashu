import Mashu from "../structures/MashuClient";
import { GuildModel, IGuildModel } from "../structures/Mongoose";
import { ISuggestion } from "../interfaces/Guild";
import { User } from "eris";

export default class SuggestionController {
    /** Create a new Suggestion */
    public async createSuggestion(content: string, creator: User, guildId: string, notificationId: string): Promise<ISuggestion | undefined> {
        const guild = await GuildModel.findOne({ "id": guildId }).exec();

        if (guild) {
            const currentAmount = guild.suggestions.length;
            const suggestion: ISuggestion = {
                id: currentAmount + 1,
                creator: `${creator.username}#${creator.discriminator}`,
                creatorId: creator.id,
                content,
                notificationId
            };

            guild.suggestions.push(suggestion);
            await guild.save();

            return await this.getSuggestion(guildId, suggestion.id);
        } else {
            return void 0;
        }
    }

    /** Get a suggestion via id */
    public async getSuggestion(guildId: string, id: number): Promise<ISuggestion | undefined> {
        const guild = await GuildModel.findOne({ "id": guildId }).exec();
        if (guild) {
            return guild.suggestions.find((s) => s.id === id);
        } else {
            return void 0;
        }
    }

    /** Accept a suggestion */
    public async acceptSuggestion(guildId: string, id: number, moderator: User, client: Mashu): Promise<ISuggestion | undefined> {
        const guild = await GuildModel.findOne({ "id": guildId }).exec();
        if (guild) {
            const accepted = await this.updateSuggestionState(guild, id, moderator, "accepted");
            if (accepted) {
                if (guild.notifyCreator) {
                    const dm = await client.getDMChannel(accepted.creatorId);
                    dm.createMessage(`Hello ${accepted.creator},\nYour suggestion has been accepted!\n\`\`\`${accepted.content}\`\`\``);
                }
                return accepted;
            } else {
                return void 0;
            }
        } else {
            return void 0;
        }
    }

    /** Decline a suggestion */
    public async declineSuggestion(guildId: string, id: number, moderator: User, client: Mashu): Promise<ISuggestion | undefined> {
        const guild = await GuildModel.findOne({ "id": guildId }).exec();
        if (guild) {
            const denied = await this.updateSuggestionState(guild, id, moderator, "denied");
            if (denied) {
                if (guild.notifyCreator) {
                    const dm = await client.getDMChannel(denied.creatorId);
                    dm.createMessage(`Hello ${denied.creator},\nYour suggestion has been denied.\n\`\`\`${denied.content}\`\`\`\n`);
                }
                return denied;
            } else {
                return void 0;
            }
        } else {
            return void 0;
        }
    }

    /** Updates the state and the moderator of a suggestion */
    public async updateSuggestionState(guild: IGuildModel, id: number, moderator: User, state: string): Promise<ISuggestion | undefined> {
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

    /** Get a list of suggestions paginated in 10 result batches */
    public async listSuggestion(guildId: string, page = 0): Promise<ISuggestion[]> {
        const guild = await GuildModel.findOne({ "id": guildId }).exec();
        if (guild) {
            return Array.from(guild.suggestions).paginate(4, page);
        } else {
            return [];
        }
    }

    /**
     * Get the amount of pages that are currently available
     *
     * @param {string} guildId - The id of the guild the suggestion was created in
     * @returns {Promise}
     */
    public async maxSuggestionPage(guildId: string): Promise<number | undefined> {
        const guild = await GuildModel.findOne({ "id": guildId }).exec();
        if (guild) {
            const suggestionCount = guild.suggestions.length;
            return Math.ceil(suggestionCount / 4);
        } else {
            return void 0;
        }
    }
}
