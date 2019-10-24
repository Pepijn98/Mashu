import { GuildModel } from "../structures/Mongoose";
import { IEvent } from "../interfaces/IEvent";
import { AnyChannel, AnyGuildChannel } from "eris";

/** When new channel is created and the guild has a muted role, add the muted role */
export const event: IEvent = {
    name: "channelCreate",
    run: async (_client, _settings, ...args) => {
        let channel: AnyChannel = args[0];
        if (channel.isGuildChannel) {
            channel = channel as AnyGuildChannel;
            const guild = await GuildModel.findOne({ "id": channel.guild.id }).exec();
            if (guild && guild.muteRole) {
                await channel.editPermission(guild.muteRole, 0, 55360, "role", "Create muted overrides");
            }
        }
    }
};
