const Eris = require("eris");
const mongoose = require("mongoose");
const TOML = require("toml");
const { join } = require("path");
const fs = require("fs");
const Command = require("./Command");

// Add functions to Eris' prototype
require("./utils/awaitMessages")(Eris);

global.Promise = require("bluebird");
mongoose.Promise = global.Promise;

const Violation = new mongoose.Schema({
    "id": String,
    "timestamp": String,
    "by": String,
    "reason": String
});

const Note = new mongoose.Schema({
    "id": String,
    "timestamp": String,
    "by": String,
    "message": String
});

const User = new mongoose.Schema({
    "id": String,
    "isBanned": Boolean,
    "isMuted": Boolean,
    "warns": [Violation],
    "bans": [Violation],
    "kicks": [Violation],
    "notes": [Note]
});

const GuildSchema = new mongoose.Schema({
    "id": String,
    "logChannel": String,
    "muteRole": String,
    "users": [User]
});

const Guild = mongoose.model("Guild", GuildSchema);

const toml = fs.readFileSync(join(__dirname, "..", "config.toml"));
const config = TOML.parse(toml);

let ready = false;
let commands = new Eris.Collection(Command);

const cmdDir = fs.readdirSync(join(__dirname, "commands"));
for (let i = 0; i < cmdDir.length; i++) {
    const file = cmdDir[i];
    if (file.endsWith(".js")) {
        const command = new (require(`./commands/${file}`))();
        commands.add(command);
    }
}

const client = new Eris.Client(config.token, {
    getAllUsers: true,
    restMode: true
});

 /**
 * Main function to handle all commands
 * @param {Eris.Message} msg
 * @param {boolean} dm
 */
async function handleCommand(msg, dm) {
    const parts = msg.content.split(" ");
    const name = parts[0].slice(config.prefix.length);

    const command = commands.find((cmd) => cmd.name === name || cmd.aliases.indexOf(name) !== -1);
    if (!command) return false; // Command doesn't exist

    const args = parts.splice(1);
    const context = {
        config,
        commands,
        database: {
            guild: Guild
        }
    };

    // Let the user know the command can only be run in a guild
    if (command.guildOnly && dm) {
        try {
            await msg.channel.createMessage(`The command \`${command}\` can only be run in a guild.`);
        } catch (e) {}
        return false;
    }

    // Check command args count
    if (command.requiredArgs > args.length) {
        try {
            await msg.channel.createMessage(`This command requires atleast ${command.requiredArgs} arguments`);
        } catch (e) {}
        return false;
    }

    // Check if command is owner only
    if (command.ownerOnly && msg.author.id !== config.owner) {
        try {
            await msg.channel.createMessage("Only the owner can execute this command.");
        } catch (e) {}
        return false;
    }

    // Only check for permission if the command is used in a guild
    if (msg.channel.guild) {
        const botPermissions = command.botPermissions;
        if (botPermissions.length > 0) {
            const member = msg.channel.guild.members.get(client.user.id);
            let missingPermissions = [];
            for (let i = 0; i < botPermissions.length; i++) {
                const hasPermission = member.permission.has(botPermissions[i]);
                if (hasPermission === false) {
                    missingPermissions.push(`**${botPermissions[i]}**`);
                }
            }

            if (missingPermissions.length > 0) {
                try {
                    await msg.channel.createMessage(`The bot is missing these required permissions: ${missingPermissions.join(", ")}`);
                } catch (e) {}
                return false;
            }
        }

        const userPermissions = command.userPermissions;
        if (userPermissions.length > 0) {
            const member = msg.channel.guild.members.get(msg.author.id);
            let missingPermissions = [];
            for (let i = 0; i < userPermissions.length; i++) {
                const hasPermission = member.permission.has(userPermissions[i]);
                if (hasPermission === false) {
                    missingPermissions.push(`**${userPermissions[i]}**`);
                }
            }

            if (missingPermissions.length > 0) {
                await msg.channel.createMessage(`You are missing these required permissions: ${missingPermissions.join(", ")}`);
                return false;
            }
        }
    }

    try {
        await command.run(msg, args, client, context);
        return true;
    } catch (error) {
        try {
            await msg.channel.createMessage({
                embed: {
                    color: 0xDC143C,
                    description: error.toString()
                }
            });
        } catch (e) {}
        return false;
    }
}

client.on("ready", async () => {
    await mongoose.connect(`mongodb://${config.database.host}:${config.database.port}/${config.database.name}`, { useNewUrlParser: true });
    console.log("Ready!");
    ready = true;
});

client.on("messageCreate", async (msg) => {
    if (!ready) return; // Bot not ready yet
    if (!msg.author) return; // Probably system message
    if (msg.author.discriminator === "0000") return; // Probably a webhook

    if (msg.content.startsWith(config.prefix)) {
        if (!msg.channel.guild && msg.author.id !== client.user.id) {
            await handleCommand(msg, true);
        } else if (msg.channel.guild) {
            await handleCommand(msg, false);
        }
    }
});

client.on("guildCreate", async (guild) => {
    const newGuild = new Guild({ "id": guild.id, "logChannel": "" });
    await newGuild.save();
});

client.on("channelCreate", async (channel) => {
    if (channel.type === 0) {
        const guild = await Guild.findOne({ "id": channel.guild.id }).exec();
        if (guild.muteRole) {
            await channel.editPermission(guild.muteRole, 0, 55360, "role", "Create muted overrides");
        }
    }
});

client.on("guildMemberAdd", async (guild, member) => {
    const dbGuild = await Guild.findOne({ "id": guild.id }).exec();
    if (dbGuild && dbGuild.muteRole) {
        const user = dbGuild.users.find((u) => u.id === member.user.id);
        if (user && user.isMuted) {
            const reason = "Member left while being muted, re-added muted role until a moderator unmutes the member";
            if (dbGuild.logChannel) {
                await client.createMessage(dbGuild.logChannel, {
                    embed: {
                        title: "MUTE",
                        color: config.colors.mute,
                        description: `**Muted:** ${member.user.mention}\n` +
                            `**By:** ${client.user.mention}\n` +
                            `**Reason:** ${reason}`,
                        timestamp: (new Date()).toISOString(),
                        footer: { text: `ID: ${member.user.id}` }
                    }
                });
            }

            await member.addRole(dbGuild.muteRole, `[MUTED] ${reason}`);
        }
    }
});

client.connect().catch(console.error);
