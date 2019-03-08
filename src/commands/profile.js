const Command = require("../Command");

class Profile extends Command {
    constructor() {
        super({
            name: "profile",
            description: "View your or someone else's profile",
            usage: "profile [member: string|mention]",
            guildOnly: true
        });
    }

    async run(msg, args, _client, { config, database }) {
        const guild = await database.guild.findOne({ "id": msg.channel.guild.id }).exec();
        if (!guild) return await msg.channel.createMessage("Couldn't find current guild in the database, make sure you've ran the setup command.");
        const userToFind = args.length ? args.join(" ") : msg.author.id;
        const member = this.findMember(msg, userToFind);
        if (!member) return await msg.channel.createMessage(`Couldn't find a member with the name **${args.join(" ")}**`);
        let user = guild.users.find((u) => u.id === member.id);
        if (!user) {
            user = { id: member.id, isBanned: false, isMuted: false, warns: [], bans: [], kicks: [], notes: [] };
            guild.users.push(user);
            await database.guild.updateOne({ "id": msg.channel.guild.id }, guild).exec();
        }

        await msg.channel.createMessage({
            embed: {
                title: `Viewing profile of ${member.nick ? member.nick : member.username}`,
                color: config.colors.default,
                timestamp: (new Date()).toISOString(),
                thumbnail: {
                    url: member.user.dynamicAvatarURL("png", 512)
                },
                description: `Username: ${member.username}#${member.discriminator}\n` +
                    `Joined At: ${(new Date(member.joinedAt)).toLocaleString("en-GB", { hour12: true, timeZone: "UTC" })}\n\n` +
                    "Most recent notes:\n" +
                    "```diff\n" +
                    "+ Not yet implemented\n" +
                    `- ${member.nick ? member.nick : member.username} has been a bad boii\n` +
                    "```",
                fields: [
                    { name: "Warns", value: user.warns.length, inline: true },
                    { name: "Kicks", value: user.kicks.length, inline: true },
                    { name: "Bans", value: user.bans.length, inline: true },
                    { name: "Notes", value: user.notes.length ? user.notes.length : "99+", inline: true }
                ],
                footer: {
                    text: `ID: ${member.id}`
                }
            }
        });
    }
}

module.exports = Profile;
