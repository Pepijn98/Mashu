import { Document, Types } from "mongoose";

export class MongooseArray<T extends Document> extends Types.DocumentArray<T> {}

export default MongooseArray;
