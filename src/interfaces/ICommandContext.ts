import Logger from "../utils/Logger";
import { ISettings } from "./ISettings";
import { IGuildModel } from "../structures/Mongoose";
import { Model } from "mongoose";

export interface IDatabaseContext {
    guild: Model<IGuildModel>;
}

export interface ICommandContext {
    settings: ISettings;
    logger: Logger;
    database: IDatabaseContext;
}
