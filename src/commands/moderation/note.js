const Command = require("../../Command");

class Note extends Command {
    constructor() {
        super({
            name: "note",
            description: "Add, remove, update or view notes for a user in the current guild =\n" +
                "= when removing or viewing notes the message is not needed =\n" +
                "= Add + or - in front of a message to mark it either positive or negative =\n" +
                "= All available actions are add, remove, update and view",
            usage: "note <action: string> <member: string|mention> <message: string>",
            category: "moderation",
            guildOnly: true,
            requiredArgs: 2,
            userPermissions: ["sendMessages", "manageRoles"],
            botPermissions: ["readMessages", "sendMessages", "manageRoles"]
        });
    }

    async run(msg, args, _client, ctx) {
        const action = args.shift();
        const username = args.shift();
        const note = args.join(" ");

        switch (action) {
            case "add":
                if (args.length === 0) {
                    await msg.channel.createMessage(`Invalid argument count, check \`${ctx.settings.prefix}help ${this.name}\` to see how this command works.`);
                } else {
                    await this.addNote(msg, note, username, ctx);
                }
                break;
            case "remove":
                await this.removeNote(msg, username, ctx);
                break;
            case "update":
                if (args.length === 0) {
                    await msg.channel.createMessage(`Invalid argument count, check \`${ctx.settings.prefix}help ${this.name}\` to see how this command works.`);
                } else {
                    await this.updateNote(msg, note, username, ctx);
                }
                break;
            case "view":
                await this.viewNotes(msg, username);
                break;
            default:
                await msg.channel.createMessage("Invalid action, please choose either add, remove or update.");
                break;
        }
    }

    async addNote(msg, noteMessage, username, ctx) {
        const guild = await ctx.database.guild.findOne({ "id": msg.channel.guild.id }).exec();
        const member = this.findMember(msg, username);
        if (!member) return await msg.channel.createMessage(`Couldn't find a member with the name **${username}**`);

        let user = guild.users.find((u) => u.id === member.id);
        if (!user) {
            user = { id: member.id, isBanned: false, isMuted: false, warns: [], bans: [], kicks: [], notes: [] };
            guild.users.add(user);
            await ctx.database.guild.updateOne({ "id": msg.channel.guild.id }, guild).exec();
        }

        const note = { id: this.generateId(), timestamp: (new Date()).toISOString(), by: msg.author.id, message: noteMessage };
        user.notes.push(note);

        await ctx.database.guild.updateOne({ "id": msg.channel.guild.id }, guild).exec();
        await msg.channel.createMessage(`New note added (id: ${note.id})`);
    }

    /* eslint-disable no-unused-vars */
    async removeNote(msg, username, ctx) {
        await msg.channel.createMessage("Feature is currently in development");
        // TODO:
        // 1. Show a list of notes that can be removed
        // 2. Wait for users message including the note's id
        // 3. Find and delete note with the given id
    }

    async updateNote(msg, noteMessage, username, ctx) {
        await msg.channel.createMessage("Feature is currently in development");
        // TODO:
        // 1. Show a list of notes that can be updated
        // 2. Wait for users message including the note's id and the new message
        // 3. Find and update note with the given id
    }

    async viewNotes(msg, username) {
        await msg.channel.createMessage("Feature is currently in development");
    }
}

module.exports = Note;
