const Command = require("../../Command");

class Profile extends Command {
    constructor(category) {
        super({
            name: "profile",
            description: "View your or someone else's profile",
            usage: "profile [member: string|mention]",
            category: category,
            guildOnly: true
        });
    }

    async run(msg, args, _client, { settings, database }) {
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

        let note = "```diff\n";
        if (user.notes.length === 0) {
            note += "No notes found for this user";
        } else {
            const notes = Array.from(user.notes);
            notes.sort((a, b) => (a.timestamp < b.timestamp) ? 1 : ((a.timestamp > b.timestamp) ? -1 : 0));
            note += `${notes[0].message}\n`;
            note += `${notes[1].message}`;
        }
        note += "```";

        await msg.channel.createMessage({
            embed: {
                title: `Viewing profile of ${member.nick ? member.nick : member.username}`,
                color: settings.colors.default,
                timestamp: (new Date()).toISOString(),
                thumbnail: {
                    url: member.user.dynamicAvatarURL("png", 512)
                },
                description: `Username: ${member.username}#${member.discriminator}\n` +
                    `Joined At: ${(new Date(member.joinedAt)).toLocaleString("en-GB", { hour12: true, timeZone: "UTC" })}\n\n` +
                    `Most recent notes:\n${note}`,
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
