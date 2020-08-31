import Command from "~/Command";
import Users from "~/models/Users";
import settings from "~/settings";
import { Message } from "eris";
import { isGuildChannel } from "~/utils/Utils";

export default class Search extends Command {
    constructor(category: string) {
        super({
            name: "search",
            description: "Search for a user entry in the database",
            usage: "search <subCommands: string> <member: string|mention>",
            example: "search bans Kurozero",
            subCommands: ["bans", "kicks", "warns"],
            category: category,
            aliases: ["find"],
            guildOnly: true,
            requiredArgs: 2
        });
    }

    async run(msg: Message, args: string[]): Promise<void> {
        if (!isGuildChannel(msg.channel)) {
            await msg.channel.createMessage("This can only be used in a guild");
            return;
        }

        const member = this.findMember(msg.channel, args[1]);
        if (!member) {
            await msg.channel.createMessage("Couldn't find a member");
            return;
        }

        try {
            const user = await Users.findOne({ id: member.user.id }).exec();
            if (!user) {
                await msg.channel.createMessage("Couldn't find this user in the database");
                return;
            }

            const messages = [];
            let message = "```md\n";

            switch (args[0]) {
                case "bans":
                    if (user.bans.length === 0) {
                        message = "This user has no ban violations";
                    } else {
                        for (let i = 0; i < user.bans.length; i++) {
                            if (message.length >= 1500) {
                                message += "```";
                                messages.push(message);
                                message = "```md\n";
                            }

                            const mod = msg.channel.guild.members.get(user.bans[i].by);

                            const num = i + 1;
                            message +=
                                `[${num}](${new Date(user.bans[i].timestamp).toLocaleString("en-GB", { hour12: true, timeZone: "UTC" })})\n` +
                                `ID:        ${user.bans[i].id}\n` +
                                `Banned by: ${mod ? mod.user.username : "Unknown"}\n` +
                                `Reason:    ${user.bans[i].reason}\n\n`;
                        }
                        message += "```";
                    }
                    messages.push(message);
                    break;
                case "kicks":
                    if (user.kicks.length === 0) {
                        message = "This user has no kick violations";
                    } else {
                        for (let i = 0; i < user.kicks.length; i++) {
                            if (message.length >= 1500) {
                                message += "```";
                                messages.push(message);
                                message = "```md\n";
                            }

                            const mod = msg.channel.guild.members.get(user.kicks[i].by);

                            const num = i + 1;
                            message +=
                                `[${num}](${new Date(user.kicks[i].timestamp).toLocaleString("en-GB", { hour12: true, timeZone: "UTC" })})\n` +
                                `ID:        ${user.kicks[i].id}\n` +
                                `Kicked by: ${mod ? mod.user.username : "Unknown"}\n` +
                                `Reason:    ${user.kicks[i].reason}\n\n`;
                        }
                        message += "```";
                    }
                    messages.push(message);
                    break;
                case "warns":
                    if (user.warns.length === 0) {
                        message = "This user has no warn violations";
                    } else {
                        for (let i = 0; i < user.warns.length; i++) {
                            if (message.length >= 1500) {
                                message += "```";
                                messages.push(message);
                                message = "```md\n";
                            }

                            const mod = msg.channel.guild.members.get(user.warns[i].by);

                            const num = i + 1;
                            message +=
                                `[${num}](${new Date(user.warns[i].timestamp).toLocaleString("en-GB", { hour12: true, timeZone: "UTC" })})\n` +
                                `ID:        ${user.warns[i].id}\n` +
                                `Warned by: ${mod ? mod.user.username : "Unknown"}\n` +
                                `Reason:    ${user.warns[i].reason}\n\n`;
                        }
                        message += "```";
                    }
                    messages.push(message);
                    break;
            }

            for (let i = 0; i < messages.length; i++) {
                await msg.channel.createMessage(messages[i]);
            }
        } catch (e) {
            await msg.channel.createMessage({
                embed: {
                    color: settings.colors.error,
                    description: e.toString()
                }
            });
            return;
        }
    }
}
