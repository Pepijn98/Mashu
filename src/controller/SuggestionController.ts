import settings from "~/settings";
import Mashu from "~/utils/MashuClient";
import Suggestions from "~/models/Suggestions";
import { ISuggestion, SuggestionDoc } from "~/types/mongo/Suggestions";
import { User } from "eris";
import { getNextSequenceValue } from "~/utils/Utils";

export default class SuggestionController {
    /** Create a new Suggestion */
    async createSuggestion(content: string, creator: User, notificationId: string): Promise<SuggestionDoc> {
        return Suggestions.create({
            sid: await getNextSequenceValue("suggestionId"),
            creator: creator.tag,
            creatorId: creator.id,
            content,
            notificationId
        });
    }

    /** Get suggestion by id */
    async getSuggestion(id: number): Promise<ISuggestion | null> {
        return Suggestions.findOne({ id }).exec();
    }

    /** Accept a suggestion */
    async acceptSuggestion(client: Mashu, moderator: User, sid: number): Promise<ISuggestion | undefined> {
        const accepted = await this.updateSuggestionState(moderator, sid, "accepted");
        if (accepted) {
            if (settings.options.notifyCreator) {
                const dm = await client.getDMChannel(accepted.creatorId);
                dm.createMessage(`Hello ${accepted.creator},\nYour suggestion has been accepted!\n\`\`\`${accepted.content}\`\`\``).catch(() => {});
            }
            return accepted;
        }
    }

    /** Decline a suggestion */
    async declineSuggestion(client: Mashu, moderator: User, sid: number): Promise<ISuggestion | undefined> {
        const denied = await this.updateSuggestionState(moderator, sid, "denied");
        if (denied) {
            if (settings.options.notifyCreator) {
                const dm = await client.getDMChannel(denied.creatorId);
                dm.createMessage(`Hello ${denied.creator},\nYour suggestion has been denied.\n\`\`\`${denied.content}\`\`\`\n`);
            }
            return denied;
        }
    }

    /** Updates the state and the moderator of a suggestion */
    async updateSuggestionState(moderator: User, sid: number, state: "accepted" | "denied"): Promise<ISuggestion | null> {
        return Suggestions.findOneAndUpdate({ sid, modId: moderator.id }, { state }).exec();
    }

    /** Get a list of suggestions paginated in 10 result batches */
    async listSuggestion(page = 0): Promise<ISuggestion[]> {
        const suggestions = await Suggestions.find({}).exec();
        if (suggestions) {
            return suggestions.paginate(4, page);
        } else {
            return [];
        }
    }

    /** Get the amount of pages that are currently available */
    async maxSuggestionPage(): Promise<number> {
        const suggestionCount = await Suggestions.countDocuments().exec();
        return Math.ceil(suggestionCount / 4);
    }
}
