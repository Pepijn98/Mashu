import mongoose from "mongoose";
import moment from "moment";
import settings from "../settings";
import Mashu from "./structures/MashuClient";
import CommandHandler from "./structures/CommandHandler";
import CommandLoader from "./structures/CommandLoader";
import Logger from "./utils/Logger";
import { promises as fs } from "fs";
import { GuildModel } from "./structures/Mongoose";

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
                                await guser.removeRole(guilds[i].muteRole, "[UNMUTE] Mute reached expiration date");
                                guilds[i].users[j].isMuted = false;
                                guilds[i].users[j].expireAt = undefined;
                                await GuildModel.updateOne({ "id": guilds[i].id }, guilds[i]).exec();
                            } else {
                                // User not in server anymore
                                // This will set it to unlimited time, when the user joins the server again it will assign the mute role again
                                // The moderators will have to remove the role manually or mute the user again with a new expiration date
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

/** Check if we missed some new guilds while being offline */
async function checkMissingGuilds(): Promise<void> {
    // Get all guilds from db and map it to ids
    const guildIDs = (await GuildModel.find({}).exec()).map((g) => g.id);

    // Check all guilds the bot sees and verify if it's in the db
    const missingGuilds = client.guilds.filter((g) => !guildIDs.includes(g.id));

    // Add all the missing guilds to the db
    for (let i = 0; i < missingGuilds.length; i++) {
        const guild = missingGuilds[i];
        const newGuild = new GuildModel({ "id": guild.id, "logChannel": "" });
        await newGuild.save();
    }
}

client.on("ready", async () => {
    if (!ready) {
        // Connect to mongodb
        await mongoose.connect(`mongodb://${settings.database.host}:${settings.database.port}/${settings.database.name}`, { useNewUrlParser: true, useUnifiedTopology: true } as any);
        // Load commands
        client.commands = await commandLoader.load(`${__dirname}/commands`);
        // Start db interval if none is active
        if (!dbInterval) dbInterval = startDBInterval();
        // Check for missing guilds
        await checkMissingGuilds();
        // Log some info
        logger.ready(`Logged in as ${client.user.tag}`);
        logger.ready(`Loaded [${client.commands.size}] commands`);
        // We're ready \o/
        ready = true; // eslint-disable-line require-atomic-updates
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

// Handle commands
client.on("messageCreate", async (msg) => {
    if (!ready) return; // Bot not ready yet
    if (!msg.author) return; // Probably system message
    if (msg.author.discriminator === "0000") return; // Probably a webhook

    client.stats.messagesSeen++;

    // If message starts with our prefix check if it's a valid command, then execute the command if valid
    if (msg.content.startsWith(settings.prefix)) {
        if (msg.channel.isGuildChannel && msg.author.id !== client.user.id) {
            await commandHandler.handleCommand(msg, false);
        } else if (msg.channel.type === 1) {
            await commandHandler.handleCommand(msg, true);
        }
    }
});

process.on("unhandledRejection", (reason) => {
    logger.error("UNHANDLED_REJECTION", reason as any);
});

process.on("SIGINT", () => {
    if (dbInterval) {
        clearInterval(dbInterval);
        dbInterval = null;
    }
    client.disconnect({ reconnect: false });
    process.exit(0);
});

async function main(): Promise<void> {
    const eventsDir = `${__dirname}/events`;
    const files = await fs.readdir(eventsDir);
    for (const file of files) {
        if (file.endsWith(".ts")) {
            const temp = await import(`${eventsDir}/${file}`);
            logger.info("EVENTS", `Loaded ${temp.event.name}`);
            client.on(temp.event.name, (...args) => temp.event.run(client, settings, args));
        }
    }

    // Connect to discord OwO
    client.connect().catch((e) => logger.error("CONNECT", e.stack));
}

main().catch((e) => logger.error("MAIN", e));
