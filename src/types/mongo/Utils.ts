import { MongooseDocument, Types } from "mongoose";

export class MongooseArray<T extends MongooseDocument> extends Types.DocumentArray<T> {}

export default MongooseArray;
