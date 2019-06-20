import Command from "../../Command";
import Mashu from "../../utils/MashuClient";
import { ICommandContext } from "../../interfaces/ICommandContext";
import { isGuildChannel } from "../../utils/Helpers";
import { Message, AnyGuildChannel } from "eris";

export default class Remove extends Command {
    public constructor(category: string) {
        super({
            name: "remove",
            description: "Remove a violation from a user",
            usage: "remove <subCommand: string> <id: string> <member: string|mention>",
            subCommands: ["warning", "ban", "kick"],
            category: category,
            guildOnly: true,
            requiredArgs: 3,
            userPermissions: ["sendMessages", "administrator"],
            botPermissions: ["readMessages", "sendMessages"]
        });
    }

    public async run(msg: Message, args: string[], _client: Mashu, { settings, database }: ICommandContext): Promise<Message | undefined> {
        if (!isGuildChannel(msg.channel)) return await msg.channel.createMessage("This can only be used in a guild");
        const channel = msg.channel as AnyGuildChannel;

        const type = args.shift();
        const id = args.shift();
        const member = this.findMember(msg, args.join(" "));
        if (!member) return await msg.channel.createMessage("Couldn't find a member.");

        try {
            const guild = await database.guild.findOne({ "id": channel.guild.id }).exec();
            if (guild) {
                const user = guild.users.find((o) => o.id === member.user.id);

                let message = "";
                if (user) {
                    if (type === "warning") {
                        user.warns = user.warns.filter((w) => w.id !== id);
                        message = `Successfully remove warning \`${id}\``;
                    } else if (type === "ban") {
                        user.bans = user.bans.filter((w) => w.id !== id);
                        message = `Succesfully remove ban \`${id}\``;
                    } else if (type === "kick") {
                        user.kicks = user.kicks.filter((w) => w.id !== id);
                        message = `Succesfully remove kick \`${id}\``;
                    }
                }

                await database.guild.updateOne({ "id": channel.guild.id }, guild).exec();
                await msg.channel.createMessage(message);
            }
        } catch (error) {
            await msg.channel.createMessage({
                embed: {
                    color: settings.colors.error,
                    description: error.toString()
                }
            });
        }
    }
}
