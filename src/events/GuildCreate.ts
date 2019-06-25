import { GuildModel } from "../utils/Mongoose";
import { IEvent } from "../interfaces/IEvent";
import { Guild } from "eris";

/** When the bot joins a new guild, create new model */
export const event: IEvent = {
    name: "guildCreate",
    run: async (_client, _settings, ...args) => {
        const guild: Guild = args[0];
        const newGuild = new GuildModel({ "id": guild.id, "logChannel": "" });
        await newGuild.save();
    }
};
