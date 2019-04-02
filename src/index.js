const Eris = require("eris");
const mongoose = require("mongoose");
const settings = require("../settings");
const Chloe = require("./utils/ChloeClient");
const CommandHandler = require("./utils/CommandHandler");
const CommandLoader = require("./utils/CommandLoader");
const GuildModel = require("./utils/Mongoose");
const Logger = require("./utils/Logger");

// Add functions to Eris' prototype
require("./utils/Extended")(Eris);

global.Promise = require("bluebird");
mongoose.Promise = global.Promise;
let ready = false;

const client = new Chloe(settings.token, {
    getAllUsers: true,
    restMode: true
});

const logger = new Logger();
const commandLoader = new CommandLoader();
const commandHandler = new CommandHandler({ settings, client, logger });

client.on("ready", async () => {
    if (!ready) {
        client.commands = await commandLoader.load(`${__dirname}/commands`);
        await mongoose.connect(`mongodb://${settings.database.host}:${settings.database.port}/${settings.database.name}`, { useNewUrlParser: true });

        logger.ready(`Logged in as ${client.user.tag}`);
        logger.ready(`Loaded [${client.commands.size}] commands`);
    } else {
        logger.ready("Reconnected");
    }

    ready = true;
});

client.on("messageCreate", async (msg) => {
    if (!ready) return; // Bot not ready yet
    if (!msg.author) return; // Probably system message
    if (msg.author.discriminator === "0000") return; // Probably a webhook

    if (msg.content.startsWith(settings.prefix)) {
        if (!msg.channel.guild && msg.author.id !== client.user.id) {
            await commandHandler.handleCommand(msg, true);
        } else if (msg.channel.guild) {
            await commandHandler.handleCommand(msg, false);
        }
    }
});

client.on("guildCreate", async (guild) => {
    const newGuild = new GuildModel({ "id": guild.id, "logChannel": "" });
    await newGuild.save();
});

client.on("channelCreate", async (channel) => {
    if (channel.type === 0) {
        const guild = await GuildModel.findOne({ "id": channel.guild.id }).exec();
        if (guild && guild.muteRole) {
            await channel.editPermission(guild.muteRole, 0, 55360, "role", "Create muted overrides");
        }
    }
});

client.on("guildMemberAdd", async (guild, member) => {
    const dbGuild = await GuildModel.findOne({ "id": guild.id }).exec();
    if (dbGuild && dbGuild.muteRole) {
        const user = dbGuild.users.find((u) => u.id === member.user.id);
        if (user && user.isMuted) {
            const reason = "Member left while being muted, re-added muted role until a moderator unmutes the member";
            if (dbGuild.logChannel) {
                await client.createMessage(dbGuild.logChannel, {
                    embed: {
                        title: "MUTE",
                        color: settings.colors.mute,
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

process.on("SIGINT", () => {
    client.disconnect({ reconnect: false });
    process.exit(0);
});

client.connect().catch((e) => logger.error("CONNECT", e.stack));
