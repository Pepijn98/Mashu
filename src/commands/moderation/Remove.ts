import Command from "~/Command";
import Users from "~/models/Users";
import settings from "~/settings";
import { Message } from "eris";
import { isGuildChannel } from "~/utils/Utils";

export default class Remove extends Command {
    constructor(category: string) {
        super({
            name: "remove",
            description: "Remove a violation from a user = \n = (this does not actually unban the member use `unban` for that)",
            usage: "remove <subCommand: string> <id: string> <member: string|mention>",
            example: "remove warning 5 Kurozero",
            subCommands: ["warning", "ban", "kick"],
            category: category,
            guildOnly: true,
            requiredArgs: 3,
            userPermissions: ["sendMessages", "administrator"],
            botPermissions: ["readMessages", "sendMessages"]
        });
    }

    async run(msg: Message, args: string[]): Promise<void> {
        if (!isGuildChannel(msg.channel)) {
            await msg.channel.createMessage("This can only be used in a guild");
            return;
        }

        const type = args.shift();
        const id = args.shift();
        const member = this.findMember(msg.channel, args.join(" "));
        if (!member) {
            await msg.channel.createMessage("Couldn't find a member");
            return;
        }

        try {
            const user = await Users.findOne({ id: member.user.id }).exec();
            if (!user) {
                await msg.channel.createMessage("User is not registered in the database");
                return;
            }

            let message = "";
            switch (type) {
                case "warning":
                    if (user.warns.length <= 0) {
                        msg.channel.createMessage("User has never been warned");
                        return;
                    }
                    const validWarn = user.warns.find((w) => w.id === id);
                    if (!validWarn) {
                        return;
                    }
                    user.warns.remove({ id });
                    message = `Successfully remove warning \`${id}\``;
                    break;
                case "ban":
                    if (user.bans.length <= 0) {
                        msg.channel.createMessage("User has never been banned");
                        return;
                    }
                    const validBan = user.bans.find((w) => w.id === id);
                    if (!validBan) {
                        return;
                    }
                    user.bans.remove({ id });
                    message = `Succesfully remove ban \`${id}\``;
                    break;
                case "kick":
                    if (user.kicks.length <= 0) {
                        msg.channel.createMessage("User has never been kicked");
                        return;
                    }
                    const validKick = user.kicks.find((w) => w.id === id);
                    if (!validKick) {
                        return;
                    }
                    user.kicks.remove({ id });
                    message = `Succesfully remove kick \`${id}\``;
                    break;
            }

            await user.save();
            await msg.channel.createMessage(message);
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
