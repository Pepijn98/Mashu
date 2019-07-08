import Command from "../../Command";
import Mashu from "../../structures/MashuClient";
import { ICommandContext } from "../../interfaces/ICommandContext";
import { isGuildChannel } from "../../utils/Helpers";
import { Message, AnyGuildChannel } from "eris";

export default class Profile extends Command {
    public constructor(category: string) {
        super({
            name: "profile",
            description: "View your or someone else's profile",
            usage: "profile [member: string|mention]",
            example: "profile Kurozero",
            category: category,
            guildOnly: true
        });
    }

    public async run(msg: Message, args: string[], _client: Mashu, { settings, database }: ICommandContext): Promise<Message | undefined> {
        if (!isGuildChannel(msg.channel)) return await msg.channel.createMessage("This can only be used in a guild");
        const channel = msg.channel as AnyGuildChannel;

        const guild = await database.guild.findOne({ "id": channel.guild.id }).exec();
        if (!guild) return await msg.channel.createMessage("Couldn't find current guild in the database, make sure you've ran the setup command.");
        const userToFind = args.length ? args.join(" ") : msg.author.id;
        const member = this.findMember(msg, userToFind);
        if (!member) return await msg.channel.createMessage(`Couldn't find a member with the name **${args.join(" ")}**`);
        let user = guild.users.find((u) => u.id === member.id);
        if (!user) {
            user = { id: member.id, isBanned: false, isMuted: false, warns: [], bans: [], kicks: [], notes: [] };
            guild.users.push(user);
            await database.guild.updateOne({ "id": channel.guild.id }, guild).exec();
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
                    { name: "Warns", value: String(user.warns.length), inline: true },
                    { name: "Kicks", value: String(user.kicks.length), inline: true },
                    { name: "Bans", value: String(user.bans.length), inline: true },
                    { name: "Notes", value: user.notes.length ? String(user.notes.length) : "99+", inline: true }
                ],
                footer: {
                    text: `ID: ${member.id}`
                }
            }
        });
    }
}
