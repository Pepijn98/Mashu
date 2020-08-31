import Command from "~/Command";
import Users from "~/models/Users";
import settings from "~/settings";
import { Message } from "eris";
import { isGuildChannel } from "~/utils/Utils";

export default class Profile extends Command {
    constructor(category: string) {
        super({
            name: "profile",
            description: "View your or someone else's profile",
            usage: "profile [member: string|mention]",
            example: "profile Kurozero",
            category,
            guildOnly: true
        });
    }

    async run(msg: Message, args: string[]): Promise<void> {
        if (!isGuildChannel(msg.channel)) {
            await msg.channel.createMessage("This can only be used in a guild");
            return;
        }

        const userToFind = args.length ? args.join(" ") : msg.author.id;
        const member = this.findMember(msg.channel, userToFind);
        if (!member) {
            await msg.channel.createMessage(`Couldn't find a member with the name **${args.join(" ")}**`);
            return;
        }

        let user = await Users.findOne({ id: member.id }).exec();
        if (!user) {
            user = this.createDBUser(member.id);
            user.save();
        }

        let note = "```diff\n";
        if (user.notes.length === 0) {
            note += "No notes found for this user";
        } else {
            const notes = Array.from(user.notes);
            notes.sort((a, b) => (a.timestamp < b.timestamp ? 1 : a.timestamp > b.timestamp ? -1 : 0));
            note += `${notes[0].message}\n`;
            note += `${notes[1].message}`;
        }
        note += "```";

        await msg.channel.createMessage({
            embed: {
                title: `Viewing profile of ${member.nick ? member.nick : member.username}`,
                color: settings.colors.default,
                timestamp: new Date().toISOString(),
                thumbnail: {
                    url: member.user.dynamicAvatarURL("png", 512)
                },
                description:
                    `Username: ${member.username}#${member.discriminator}\n` +
                    `Joined At: ${new Date(member.joinedAt).toLocaleString("en-GB", { hour12: true, timeZone: "UTC" })}\n\n` +
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
