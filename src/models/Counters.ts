import { Schema, model, Document } from "mongoose";

interface ICounter extends Document {
    _id: string;
    sequence_value: number;
}

export const Counter = new Schema<ICounter>({
    _id: String,
    sequence_value: Number
});

export const Counters = model<ICounter>("Counters", Counter);

export default Counters;
