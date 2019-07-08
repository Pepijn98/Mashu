import { IViolation, INote, IUser, ISuggestion, IGuild } from "../interfaces/Guild";
import { Document, Schema, Model, model } from "mongoose";

// This includes bans, kicks and warns
const Violation = new Schema<IViolation>({
    "id": String,
    "timestamp": String,
    "by": String,
    "reason": String
});

const Note = new Schema<INote>({
    "id": String,
    "timestamp": String,
    "by": String,
    "message": String
});

const User = new Schema<IUser>({
    "id": String,
    "isBanned": Boolean,
    "isMuted": Boolean,
    "warns": [Violation],
    "bans": [Violation],
    "kicks": [Violation],
    "notes": [Note],
    "expireAt": Date
});

const SuggestionSchema = new Schema<ISuggestion>({
    "id": Number,
    "creator": String,
    "creatorId": String,
    "moderator": String,
    "modId": String,
    "state": { "default": "created", "type": String },
    "content": String,
    "notificationId": String
});

// @ts-ignore
export interface IGuildModel extends IGuild, Document {}

const GuildSchema = new Schema<IGuildModel>({
    "id": String,
    "logChannel": String,
    "suggestionChannel": String,
    "notifyCreator": { "default": false, "type": Boolean },
    "muteRole": String,
    "users": [User],
    "suggestions": [SuggestionSchema]
});

export const GuildModel: Model<IGuildModel> = model<IGuildModel>("Guild", GuildSchema);
