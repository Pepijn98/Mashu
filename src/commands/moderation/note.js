const Command = require("../../Command");

class Note extends Command {
    constructor(category) {
        super({
            name: "note",
            description: "Add, remove, update or view notes for a user in the current guild =\n" +
                "= when removing or viewing notes the message is not needed =\n" +
                "= Add + or - in front of a message to mark it either positive or negative =\n" +
                "= All available actions are add, remove, update and view",
            usage: "note <action: string> <member: string|mention> <message: string>",
            category: category,
            guildOnly: true,
            requiredArgs: 2,
            userPermissions: ["sendMessages", "manageRoles"],
            botPermissions: ["readMessages", "sendMessages", "manageRoles"]
        });
    }

    async run(msg, args, client, ctx) {
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
                await this.removeNote(msg, username, client, ctx);
                break;
            case "update":
                await this.updateNote(msg, username, client, ctx);
                break;
            case "view":
                await this.viewNotes(msg, username, client, ctx);
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

    async removeNote(msg, username, client, ctx) {
        const guild = await ctx.database.guild.findOne({ "id": msg.channel.guild.id }).exec();
        const member = this.findMember(msg, username);
        if (!member) return await msg.channel.createMessage(`Couldn't find a member with the name **${username}**`);

        let user = guild.users.find((u) => u.id === member.id);
        if (!user) {
            user = { id: member.id, isBanned: false, isMuted: false, warns: [], bans: [], kicks: [], notes: [] };
            guild.users.add(user);
            await ctx.database.guild.updateOne({ "id": msg.channel.guild.id }, guild).exec();
        }

        const notes = Array.from(user.notes);
        if (notes.length > 0) {
            let messageQueue = [];
            let currentMessage = "```md\n# Here's a list of all notes\n\n";
            for (let i = 0; i < notes.length; i++) {
                let note = notes[i];
                let toAdd = `[id: ${note.id}] | ${note.message}\n\n`;
                if (currentMessage.length + toAdd.length >= 200) {
                    messageQueue.push(`${currentMessage}\`\`\``);
                    currentMessage = "```md\n";
                }
                currentMessage += `\n${toAdd}`;
            }
            messageQueue.push(`${currentMessage}\`\`\``);

            await client.reactionButtonMessage(msg, messageQueue, 30000, 0, [
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
            const responses = await msg.channel.awaitMessages((m) => m.author.id === msg.author.id, { time: 30000, maxMatches: 1 });
            if (responses.length) {
                const content = responses[0]
                    ? responses[0].content.toLowerCase()
                    : null;

                if (content === null) return await msg.channel.createMessage("Error getting a response");
                if (content === "exit") return;

                const check = notes.find((n) => n.id === content);
                if (!check) return await msg.channel.createMessage(`No note found with the id \`${content}\``);

                user.notes = user.notes.filter((n) => n.id !== content);

                await ctx.database.guild.updateOne({ "id": msg.channel.guild.id }, guild);
                await msg.channel.createMessage(`Removed note \`${content}\` from **${member.nick ? member.nick : member.username}**`);
            } else {
                await msg.channel.createMessage(`${msg.author.mention}, Times up! You've waited too long to respond.`);
            }
        } else {
            await msg.channel.createMessage("This user has no notes");
        }
    }

    async updateNote(msg, username, client, ctx) { // eslint-disable-line no-unused-vars
        const guild = await ctx.database.guild.findOne({ "id": msg.channel.guild.id }).exec();
        const member = this.findMember(msg, username);
        if (!member) return await msg.channel.createMessage(`Couldn't find a member with the name **${username}**`);

        let user = guild.users.find((u) => u.id === member.id);
        if (!user) {
            user = { id: member.id, isBanned: false, isMuted: false, warns: [], bans: [], kicks: [], notes: [] };
            guild.users.add(user);
            await ctx.database.guild.updateOne({ "id": msg.channel.guild.id }, guild).exec();
        }

        const notes = Array.from(user.notes);
        if (notes.length > 0) {
            let messageQueue = [];
            let currentMessage = "```md\n# Here's a list of all notes\n\n";
            for (let i = 0; i < notes.length; i++) {
                let note = notes[i];
                let toAdd = `[id: ${note.id}] | ${note.message}\n\n`;
                if (currentMessage.length + toAdd.length >= 200) {
                    messageQueue.push(`${currentMessage}\`\`\``);
                    currentMessage = "```md\n";
                }
                currentMessage += `\n${toAdd}`;
            }
            messageQueue.push(`${currentMessage}\`\`\``);

            await client.reactionButtonMessage(msg, messageQueue, 30000, 0, [
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
            const responses = await msg.channel.awaitMessages((m) => m.author.id === msg.author.id, { time: 30000, maxMatches: 1 });
            if (responses.length) {
                let content = responses[0]
                    ? responses[0].content.toLowerCase()
                    : "";

                if (!content) return await msg.channel.createMessage("Error getting a response");
                if (content === "exit") return;

                content = content.split(" ");
                const id = content.shift();
                const newReason = content.join(" ");

                const note = notes.find((n) => n.id === id);
                if (!note) return await msg.channel.createMessage(`No note found with the id \`${content}\``);

                note.message = newReason;

                await ctx.database.guild.updateOne({ "id": msg.channel.guild.id }, guild);
                await msg.channel.createMessage(`Updated note \`${id}\` from **${member.nick ? member.nick : member.username}**`);
            } else {
                await msg.channel.createMessage(`${msg.author.mention}, Times up! You've waited too long to respond.`);
            }
        } else {
            await msg.channel.createMessage("This user has no notes");
        }
    }

    async viewNotes(msg, username, client, ctx) {
        const guild = await ctx.database.guild.findOne({ "id": msg.channel.guild.id }).exec();
        const member = this.findMember(msg, username);
        if (!member) return await msg.channel.createMessage(`Couldn't find a member with the name **${username}**`);

        let user = guild.users.find((u) => u.id === member.id);
        if (!user) {
            user = { id: member.id, isBanned: false, isMuted: false, warns: [], bans: [], kicks: [], notes: [] };
            guild.users.add(user);
            await ctx.database.guild.updateOne({ "id": msg.channel.guild.id }, guild).exec();
        }

        const notes = Array.from(user.notes);
        if (notes.length > 0) {
            let messageQueue = [];
            let currentMessage = "```md\n# Here's a list of all notes\n\n";
            for (let i = 0; i < notes.length; i++) {
                let note = notes[i];
                let toAdd = `[id: ${note.id}] | ${note.message}\n\n`;
                if (currentMessage.length + toAdd.length >= 200) {
                    messageQueue.push(`${currentMessage}\`\`\``);
                    currentMessage = "```md\n";
                }
                currentMessage += `\n${toAdd}`;
            }
            messageQueue.push(`${currentMessage}\`\`\``);

            await client.reactionButtonMessage(msg, messageQueue, 30000, 0, [
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
        } else {
            await msg.channel.createMessage("This user has no notes");
        }
    }
}

module.exports = Note;
