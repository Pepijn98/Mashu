const Command = require("../Command");

class Search extends Command {
    constructor() {
        super({
            name: "search",
            description: "Search for a user entry in the database",
            usage: "search <bans|kicks|warns> <member: string|mention>",
            guildOnly: true,
            requiredArgs: 2
        });
    }

    async run(msg, args, _client, ctx) {
        const member = this.findMember(msg, args[1]);
        if (!member) return await msg.channel.createMessage("Couldn't find a member.");

        try {
            const guild = await ctx.database.guild.findOne({ "id": msg.channel.guild.id }).exec();
            if (guild) {
                const user = guild.users.find((o) => o.id === member.user.id);
                if (user) {
                    let message = "```md\n";

                    if (args[0] === "bans") {
                        if (user.bans.length === 0) {
                            message = "This user has no ban violations.";
                        } else {
                            for (let i = 0; i < user.bans.length; i++) {
                                let num = i + 1;
                                message += `[${num}](${(new Date(user.bans[i].timestamp)).toLocaleString()})\n` +
                                `ID:        ${user.bans[i].id}\n` +
                                `Banned by: ${msg.channel.guild.members.get(user.bans[i].by).user.username}\n` +
                                `Reason:    ${user.bans[i].reason}\n\n`;
                            }
                            message += "```";
                        }
                    } else if (args[0] === "kicks") {
                        if (user.kicks.length === 0) {
                            message = "This user has no kick violations.";
                        } else {
                            for (let i = 0; i < user.kicks.length; i++) {
                                let num = i + 1;
                                message += `[${num}](${(new Date(user.kicks[i].timestamp)).toLocaleString()})\n` +
                                `ID:        ${user.kicks[i].id}\n` +
                                `Kicked by: ${msg.channel.guild.members.get(user.kicks[i].by).user.username}\n` +
                                `Reason:    ${user.kicks[i].reason}\n\n`;
                            }
                            message += "```";
                        }
                    } else if (args[0] === "warns") {
                        if (user.warns.length === 0) {
                            message = "This user has no warn violations.";
                        } else {
                            for (let i = 0; i < user.warns.length; i++) {
                                let num = i + 1;
                                message += `[${num}](${(new Date(user.warns[i].timestamp)).toLocaleString()})\n` +
                                    `ID:        ${user.warns[i].id}\n` +
                                    `Warned by: ${msg.channel.guild.members.get(user.warns[i].by).user.username}\n` +
                                    `Reason:    ${user.warns[i].reason}\n\n`;
                            }
                            message += "```";
                        }
                    }

                    await msg.channel.createMessage(message);
                } else {
                    return await msg.channel.createMessage("Couldn't find this user in the database.");
                }
            }
        } catch (e) {
            return await msg.channel.createMessage({
                embed: {
                    color: ctx.config.embedColor,
                    description: e.toString()
                }
            });
        }
    }
}

module.exports = Search;
