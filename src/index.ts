import mongoose from "mongoose";
import moment from "moment";
import settings from "../settings";
import Mashu from "./utils/MashuClient";
import CommandHandler from "./utils/CommandHandler";
import CommandLoader from "./utils/CommandLoader";
import Logger from "./utils/Logger";
import { GuildModel } from "./utils/Mongoose";
import { isGuildChannel } from "./utils/Helpers";
import { AnyChannel, AnyGuildChannel, Guild, Member } from "eris";

import "./utils/Extended";

// Whether the bot is ready or not
let ready = false;
// the DB interval
let dbInterval: NodeJS.Timeout | null = null;

// Initialize discord client
const client = new Mashu(settings.token, {
    getAllUsers: true,
    restMode: true
});

// Initialize logger, command loader and command handler
const logger = new Logger();
const commandLoader = new CommandLoader(logger);
const commandHandler = new CommandHandler({ settings, client, logger });

/** Start the interval to check the db for expired mute dates */
function startDBInterval(): NodeJS.Timeout {
    logger.info("INTERVAL", "Interval started");
    return setInterval(async () => {
        const guilds = await GuildModel.find({}).exec();
        for (let i = 0; i < guilds.length; i++) {
            for (let j = 0; j < guilds[i].users.length; j++) {
                if (guilds[i].users[j].expireAt) {
                    const now = moment(Date.now()).utc().toDate();
                    if (guilds[i].users[j].expireAt! < now) {
                        const guild = client.guilds.get(guilds[i].id);
                        if (guild) {
                            const guser = guild.members.get(guilds[i].users[j].id);
                            if (guser) {
                                await guser.removeRole(guilds[i].muteRole, "Mute reached expiration date");
                                guilds[i].users[j].isMuted = false;
                                guilds[i].users[j].expireAt = undefined;
                                await GuildModel.updateOne({ "id": guilds[i].id }, guilds[i]).exec();
                            } else {
                                // User not in server anymore
                                // This will set it to unlimited time so the moderators will have to remove the role manually
                                // Or mute the user again with a new expiration date
                                guilds[i].users[j].expireAt = undefined;
                                await GuildModel.updateOne({ "id": guilds[i].id }, guilds[i]).exec();
                            }
                        } else {
                            logger.warn("INTERVAL", "Guild not found");
                            // Bot not in server anymore, not sure what to do here
                            // 1. Remove server from database
                            // 2. Presist server data for x amount of time
                            // Maybe something else but idk at the moment
                        }
                    }
                }
            }
        }
    }, 60000); // Every minute
}

client.on("ready", async () => {
    if (!ready) {
        // Connect to mongodb
        await mongoose.connect(`mongodb://${settings.database.host}:${settings.database.port}/${settings.database.name}`, { useNewUrlParser: true });
        // Load commands
        client.commands = await commandLoader.load(`${__dirname}/commands`);

        console.log(client.commands);

        // Start db interval if none is active
        if (!dbInterval) dbInterval = startDBInterval();

        logger.ready(`Logged in as ${client.user.tag}`);
        logger.ready(`Loaded [${client.commands.size}] commands`);

        ready = true;
    } else {
        // Start db interval if none is active
        if (!dbInterval) dbInterval = startDBInterval();
        logger.ready("Client reconnected");
    }
});

// Handle disconnects
client.on("disconnect", () => {
    logger.warn("DISCONNECT", "Client disconnected");
    if (dbInterval) {
        clearInterval(dbInterval);
        dbInterval = null;
    }
});

client.on("messageCreate", async (msg) => {
    if (!ready) return; // Bot not ready yet
    if (!msg.author) return; // Probably system message
    if (msg.author.discriminator === "0000") return; // Probably a webhook

    // If message starts with our prefix check if it's a valid command, then execute the command if valid
    if (msg.content.startsWith(settings.prefix)) {
        if (isGuildChannel(msg.channel) && msg.author.id !== client.user.id) {
            await commandHandler.handleCommand(msg, false);
        } else if (msg.channel.type === 1) {
            await commandHandler.handleCommand(msg, true);
        }
    }
});

// When the bot joins a new guild, create new model
client.on("guildCreate", async (guild: Guild) => {
    const newGuild = new GuildModel({ "id": guild.id, "logChannel": "" });
    await newGuild.save();
});

// When new channel is created and the guild has a muted role, add the muted role
client.on("channelCreate", async (channel: AnyChannel) => {
    if (isGuildChannel(channel)) {
        channel = channel as AnyGuildChannel;
        const guild = await GuildModel.findOne({ "id": channel.guild.id }).exec();
        if (guild && guild.muteRole) {
            await channel.editPermission(guild.muteRole, 0, 55360, "role", "Create muted overrides");
        }
    }
});

// Handle muted members trying to re-join the server
client.on("guildMemberAdd", async (guild: Guild, member: Member) => {
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

process.on("unhandledRejection", (reason) => {
    logger.error("UNHANDLED_REJECTION", reason);
});

process.on("SIGINT", () => {
    if (dbInterval) {
        clearInterval(dbInterval);
        dbInterval = null;
    }
    client.disconnect({ reconnect: false });
    process.exit(0);
});

// Connect to discord OwO
client.connect().catch((e) => logger.error("CONNECT", e.stack));
