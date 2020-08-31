import { NoteDoc, UserDoc, ViolationDoc } from "~/types/mongo/Users";
import { Schema, model } from "mongoose";

// This includes bans, kicks and warns
export const Violation = new Schema<ViolationDoc>({
    id: String,
    timestamp: String,
    by: String,
    reason: String
});

export const Note = new Schema<NoteDoc>({
    id: String,
    timestamp: String,
    by: String,
    message: String
});

export const User = new Schema<UserDoc>({
    id: String,
    isBanned: Boolean,
    isMuted: Boolean,
    warns: [Violation],
    bans: [Violation],
    kicks: [Violation],
    notes: [Note],
    expireAt: Date
});

export const Users = model<UserDoc>("Users", User);

export default Users;
