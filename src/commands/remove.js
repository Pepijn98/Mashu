const Command = require("../Command");

class Remove extends Command {
    constructor() {
        super({
            name: "remove",
            description: "Remove a violation from a user",
            usage: "remove <warning|ban|kick> <id: string> <member: string|mention>",
            guildOnly: true,
            requiredArgs: 3,
            userPermissions: ["sendMessages", "administrator"],
            botPermissions: ["readMessages", "sendMessages"]
        });
    }

    async run(msg, args, _client, ctx) {
        const type = args.shift();
        const id = args.shift();
        const member = this.findMember(msg, args.join(" "));
        if (!member) return await msg.channel.createMessage("Couldn't find a member.");

        try {
            const guild = await ctx.database.guild.findOne({ "id": msg.channel.guild.id }).exec();
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

                await ctx.database.guild.updateOne({ "id": msg.channel.guild.id }, guild).exec();
                await msg.channel.createMessage(message);
            }
        } catch (error) {
            await msg.channel.createMessage({
                embed: {
                    color: ctx.config.embedColor,
                    description: error.toString()
                }
            });
        }
    }
}

module.exports = Remove;
