import Command from "~/Command";
import Mashu from "~/utils/MashuClient";
import settings from "~/settings";
import Users from "~/models/Users";
import { ICommandContext } from "~/types/ICommandContext";
import { Message, Member } from "eris";
import { isGuildChannel } from "~/utils/Utils";
import { MongooseArray } from "~/types/mongo/Utils";
import { INote, NoteDoc, UserDoc } from "~/types/mongo/Users";

export default class Note extends Command {
    client!: Mashu;

    constructor(category: string) {
        super({
            name: "note",
            description:
                "Add, remove, update or view notes for a user in the current guild =\n" +
                "= when removing, viewing or updating notes the message is not needed =\n" +
                "= Add + or - in front of a message to mark it either positive or negative =\n" +
                "= All available actions are add, remove, update and view",
            usage: "note <action: string> <member: string|mention> <message: string>",
            example: "note add Kurozero +Adding a positive note",
            subCommands: ["add", "remove", "update", "view"],
            category,
            guildOnly: true,
            requiredArgs: 2,
            userPermissions: ["sendMessages", "manageGuild"],
            botPermissions: ["readMessages", "sendMessages"]
        });
    }

    async run(msg: Message, args: string[], { client }: ICommandContext): Promise<void> {
        if (!isGuildChannel(msg.channel)) {
            await msg.channel.createMessage("This can only be used in a guild");
            return;
        }

        this.client = client;

        const action = args.shift();
        const username = args.shift() || "";
        const note = args.join(" ");

        if (!action || !this.subCommands.includes(action)) {
            await msg.channel.createMessage("Invalid action, please choose either add, remove or update");
            return;
        }

        const member = this.findMember(msg.channel, username);
        if (!member) {
            await msg.channel.createMessage(`Couldn't find a member with the name **${username}**`);
            return;
        }

        let user = await Users.findOne({ id: member.id }).exec();
        if (!user) user = this.createDBUser(member.id);

        switch (action) {
            case "add":
                if (args.length === 0) {
                    await msg.channel.createMessage(`Invalid argument count, check \`${settings.prefix}help ${this.name}\` to see how this command works.`);
                } else {
                    await this.addNote(msg, note, user);
                }
                break;
            case "remove":
                await this.removeNote(msg, user, member);
                break;
            case "update":
                await this.updateNote(msg, user, member);
                break;
            case "view":
                await this.viewNotes(msg, user);
                break;
            default:
                await msg.channel.createMessage("Invalid action, please choose either add, remove or update");
                break;
        }
    }

    /** Add new note to user */
    async addNote(msg: Message, noteMessage: string, user: UserDoc): Promise<void> {
        const note: INote = { id: this.generateId(), timestamp: new Date().toISOString(), by: msg.author.id, message: noteMessage };
        user.notes.create(note);

        await user.save();
        await msg.channel.createMessage(`New note added (id: ${note.id})`);
    }

    /** Remove note form user by id */
    async removeNote(msg: Message, user: UserDoc, member: Member): Promise<void> {
        if (user.notes.length <= 0) {
            await msg.channel.createMessage("This user has no notes");
            return;
        }

        // Show a paginatable embed with all notes of this user
        await this.listNotes(msg, user.notes);
        await msg.channel.createMessage("Please reply with the id of the note you want to delete");
        const responses = await msg.channel.awaitMessages((m) => m.author.id === msg.author.id, { time: 30000, maxMatches: 1 });
        if (responses.length < 1) {
            await msg.channel.createMessage(`${msg.author.mention}, Times up! You've waited too long to respond.`);
            return;
        }

        const content = responses[0] ? responses[0].content.toLowerCase() : null;
        if (!content) {
            await msg.channel.createMessage("Error getting a response");
            return;
        }

        if (content === "exit") {
            return;
        }

        const note = user.notes.find((n) => n.id === content);
        if (!note) {
            await msg.channel.createMessage(`No note found with the id \`${content}\``);
            return;
        }

        user.notes.remove({ id: note.id });

        await user.save();
        await msg.channel.createMessage(`Removed note \`${content}\` from **${member.nick ? member.nick : member.username}**`);
    }

    /** Update note from user */
    async updateNote(msg: Message, user: UserDoc, member: Member): Promise<void> {
        if (!isGuildChannel(msg.channel)) {
            await msg.channel.createMessage("This can only be used in a guild");
            return;
        }

        if (user.notes.length <= 0) {
            await msg.channel.createMessage("This user has no notes");
            return;
        }

        // Show a paginatable embed with all notes of this user
        await this.listNotes(msg, user.notes);
        await msg.channel.createMessage("Please reply with the id of the note you want to update and a new message for the note");
        const responses = await msg.channel.awaitMessages((m) => m.author.id === msg.author.id, { time: 30000, maxMatches: 1 });
        if (responses.length < 1) {
            await msg.channel.createMessage(`${msg.author.mention}, Times up! You've waited too long to respond.`);
            return;
        }

        const content_str = responses[0] ? responses[0].content.toLowerCase() : "";
        if (!content_str) {
            await msg.channel.createMessage("Error getting a response");
            return;
        }

        if (content_str === "exit") {
            return;
        }

        const content = content_str.split(" ");
        const id = content.shift();
        const new_reason = content.join(" ");

        const note = user.notes.find((n) => n.id === id);
        if (!note) {
            await msg.channel.createMessage(`No note found with the id \`${content}\``);
            return;
        }

        note.message = new_reason;

        await user.save();
        await msg.channel.createMessage(`Updated note \`${id}\` from **${member.nick ? member.nick : member.username}**`);
    }

    /** View all notes from a user */
    async viewNotes(msg: Message, user: UserDoc): Promise<void> {
        if (!isGuildChannel(msg.channel)) {
            await msg.channel.createMessage("This can only be used in a guild");
            return;
        }

        if (user.notes.length <= 0) {
            await msg.channel.createMessage("This user has no notes");
            return;
        }

        // Show a paginatable embed with all notes of this user
        await this.listNotes(msg, user.notes);
    }

    async listNotes(msg: Message, notes: MongooseArray<NoteDoc>): Promise<void> {
        const messageQueue: string[] = [];
        let currentMessage = "```md\n# Here's a list of all notes\n\n";
        for (const note of notes) {
            const toAdd = `[id: ${note.id}] | ${note.message}\n\n`;
            if (currentMessage.length + toAdd.length >= 200) {
                messageQueue.push(`${currentMessage}\`\`\``);
                currentMessage = "```md\n";
            }
            currentMessage += `\n${toAdd}`;
        }
        messageQueue.push(`${currentMessage}\`\`\``);

        await this.client.reactionButtonMessage(msg, messageQueue, 30000, 0, [
            {
                emoji: "first:562913670921715723",
                type: "first"
            },
            {
                emoji: "⬅",
                type: "previous"
            },
            {
                emoji: "⏹",
                type: "cancel"
            },
            {
                emoji: "➡",
                type: "next"
            },
            {
                emoji: "last:562913671102070799",
                type: "last"
            }
        ]);
    }
}
