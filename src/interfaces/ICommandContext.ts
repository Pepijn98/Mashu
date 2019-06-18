import Logger from "../utils/Logger";
import { ISettings } from "./ISettings";
import { Model } from "mongoose";
import { IGuildModel } from "../utils/Mongoose";

export interface ICommandContext {
    settings: ISettings;
    logger: Logger;
    database: {
        guild: Model<IGuildModel>;
    };
}
