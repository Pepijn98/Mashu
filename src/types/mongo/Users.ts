import { MongooseArray } from "./Utils";
import { Document, ObjectId } from "mongoose";

export interface IViolation {
    id: string;
    timestamp: string;
    by: string;
    reason: string;
}

export type ViolationDoc = IViolation & Document;

export interface INote {
    id: string;
    timestamp: string;
    by: string;
    message: string;
}

export type NoteDoc = INote & Document;

export interface IUser {
    id: string;
    isBanned: boolean;
    isMuted: boolean;
    warns: MongooseArray<ViolationDoc>;
    bans: MongooseArray<ViolationDoc>;
    kicks: MongooseArray<ViolationDoc>;
    notes: MongooseArray<NoteDoc>;
    expireAt?: Date;
}

export type UserDoc = IUser & Document & { _id: ObjectId };
