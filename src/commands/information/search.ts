import Command from "../../Command";
import Mashu from "../../utils/MashuClient";
import { ICommandContext } from "../../interfaces/ICommandContext";
import { isGuildChannel } from "../../utils/Helpers";
import { Message, AnyGuildChannel } from "eris";

export default class Search extends Command {
    public constructor(category: string) {
        super({
            name: "search",
            description: "Search for a user entry in the database",
            usage: "search <subCommands: string> <member: string|mention>",
            subCommands: ["bans", "kicks", "warns"],
            category: category,
            aliases: ["find"],
            guildOnly: true,
            requiredArgs: 2
        });
    }

    public async run(msg: Message, args: string[], _client: Mashu, { settings, database }: ICommandContext): Promise<Message | undefined> {
        if (!isGuildChannel(msg.channel)) return await msg.channel.createMessage("This can only be used in a guild");
        const channel = msg.channel as AnyGuildChannel;

        const member = this.findMember(msg, args[1]);
        if (!member) return await msg.channel.createMessage("Couldn't find a member.");

        try {
            const guild = await database.guild.findOne({ "id": channel.guild.id }).exec();
            if (guild) {
                const user = guild.users.find((o) => o.id === member.user.id);
                if (user) {
                    let messages = [];
                    let message = "```md\n";

                    if (args[0] === "bans") {
                        if (user.bans.length === 0) {
                            message = "This user has no ban violations.";
                        } else {
                            for (let i = 0; i < user.bans.length; i++) {
                                if (message.length >= 1500) {
                                    message += "```";
                                    messages.push(message);
                                    message = "```md\n";
                                }

                                const mod = channel.guild.members.get(user.bans[i].by);

                                let num = i + 1;
                                message += `[${num}](${(new Date(user.bans[i].timestamp)).toLocaleString("en-GB", { hour12: true, timeZone: "UTC" })})\n` +
                                    `ID:        ${user.bans[i].id}\n` +
                                    `Banned by: ${mod ? mod.user.username : "Unknown"}\n` +
                                    `Reason:    ${user.bans[i].reason}\n\n`;
                            }
                            message += "```";
                        }
                        messages.push(message);
                    } else if (args[0] === "kicks") {
                        if (user.kicks.length === 0) {
                            message = "This user has no kick violations.";
                        } else {
                            for (let i = 0; i < user.kicks.length; i++) {
                                if (message.length >= 1500) {
                                    message += "```";
                                    messages.push(message);
                                    message = "```md\n";
                                }

                                const mod = channel.guild.members.get(user.kicks[i].by);

                                let num = i + 1;
                                message += `[${num}](${(new Date(user.kicks[i].timestamp)).toLocaleString("en-GB", { hour12: true, timeZone: "UTC" })})\n` +
                                    `ID:        ${user.kicks[i].id}\n` +
                                    `Kicked by: ${mod ? mod.user.username : "Unknown"}\n` +
                                    `Reason:    ${user.kicks[i].reason}\n\n`;
                            }
                            message += "```";
                        }
                        messages.push(message);
                    } else if (args[0] === "warns") {
                        if (user.warns.length === 0) {
                            message = "This user has no warn violations.";
                        } else {
                            for (let i = 0; i < user.warns.length; i++) {
                                if (message.length >= 1500) {
                                    message += "```";
                                    messages.push(message);
                                    message = "```md\n";
                                }

                                const mod = channel.guild.members.get(user.warns[i].by);

                                let num = i + 1;
                                message += `[${num}](${(new Date(user.warns[i].timestamp)).toLocaleString("en-GB", { hour12: true, timeZone: "UTC" })})\n` +
                                    `ID:        ${user.warns[i].id}\n` +
                                    `Warned by: ${mod ? mod.user.username : "Unknown"}\n` +
                                    `Reason:    ${user.warns[i].reason}\n\n`;
                            }
                            message += "```";
                        }
                        messages.push(message);
                    }

                    for (let i = 0; i < messages.length; i++) {
                        await msg.channel.createMessage(messages[i]);
                    }
                } else {
                    return await msg.channel.createMessage("Couldn't find this user in the database.");
                }
            }
        } catch (e) {
            return await msg.channel.createMessage({
                embed: {
                    color: settings.colors.error,
                    description: e.toString()
                }
            });
        }
    }
}
