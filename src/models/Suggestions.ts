import { SuggestionDoc } from "~/types/mongo/Suggestions";
import { Schema, model } from "mongoose";

export const Suggestion = new Schema<SuggestionDoc>({
    sid: Number,
    creator: String,
    creatorId: String,
    moderator: String,
    modId: String,
    state: { default: "created", type: String },
    content: String,
    notificationId: String
});

export const Suggestions = model<SuggestionDoc>("Suggestions", Suggestion);

export default Suggestions;
