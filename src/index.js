const Eris = require("eris");
const TOML = require("toml");
const { join } = require("path");
const fs = require("fs");

/**
 * @typedef {Object} Config
 * @property {string}  token        - The bot's token
 * @property {string}  prefix       - The bot's global prefix
 * @property {string|number}  embedColor   - Default embed color
 */

/**
 * @typedef {Object} Command
 * @property {Array<string>}  userPermissions   - Permissions required by the user who executed the command
 * @property {Array<string>}  botPermissions    - Permissions required by the bot to execute the command
 * @property {boolean}        guildOnly         - Whether the command can only be used in a guild or not
 * @property {string}         description       - The description of the command
 * @property {string}         usage             - The command usage
 * @property {Function}       run               - The functionality behind the command
 */

/**
 * @typedef {Object<string, Command>} Commands  - An object with all the available commands
 */

const toml = fs.readFileSync(join(__dirname, "..", "config.toml"));
/** @type {Config} */
const config = TOML.parse(toml);
config.embedColor = parseInt(config.embedColor, 16);
let ready = false;

/** @type {Commands} */
let commands = {};
const cmdDir = fs.readdirSync(join(__dirname, "commands"));
for (let i = 0; i < cmdDir.length; i++) {
    const file = cmdDir[i];
    if (file.endsWith(".js")) {
        const name = file.replace(".js", "");
        const options = require(`./commands/${file}`);
        commands[name] = options;
    }
}

const client = new Eris.Client(config.token, {
    getAllUsers: true
});

 /**
 * Main function to handle all commands
 * @param {Eris.Message} msg
 * @param {boolean} dm
 */
async function handleCommand(msg, dm) {
    const parts = msg.content.split(" ");
    const command = parts[0].slice(config.prefix.length);

    if (!commands[command]) return; // Command doesn't exist

    // Let the user know the command can only be run in a guild
    if (commands[command].guildOnly && dm) {
        try {
            await msg.channel.createMessage(`The command \`${command}\` can only be run in a guild.`);
        } catch (error) {
            console.error(error);
        }
        return;
    }

    const args = parts.splice(1);
    const context = {
        config: config,
        database: {}
    };

    // Only check for permission if the command is used in a guild
    if (msg.channel.guild) {
        const botPermissions = commands[command].botPermissions;
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
                return await msg.channel.createMessage(`The bot is missing these required permissions: ${missingPermissions.join(", ")}`);
            }
        }

        const userPermissions = commands[command].userPermissions;
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
                return await msg.channel.createMessage(`You are missing these required permissions: ${missingPermissions.join(", ")}`);
            }
        }
    }

    try {
        await commands[command].run(msg, args, client, context);
    } catch (error) {
        try {
            await msg.channel.createMessage({
                embed: {
                    color: 0xDC143C,
                    description: error.toString()
                }
            });
        } catch (e) {
            console.error(e);
        }
    }
}

client.on("ready", () => {
    console.log("Ready!");
    ready = true;
});

client.on("messageCreate", async (msg) => {
    if (!ready) return; // Bot not ready yet
    if (!msg.author) return; // Probably system message
    if (msg.author.discriminator === "0000") return; // Probably a webhook

    if (!msg.channel.guild && msg.author.id !== client.user.id) {
        if (msg.content.startsWith(config.prefix)) {
            await handleCommand(msg, true);
        }
    } else if (msg.channel.guild) {
        if (msg.content.startsWith(config.prefix)) {
            await handleCommand(msg, false);
        }
    }
});

client.connect().catch(console.error);
