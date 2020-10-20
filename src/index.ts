import "./utils/Extensions";

import path from "path";
import mongoose from "mongoose";
import moment from "moment";
import Yukikaze from "yukikaze";
import settings from "./settings";
import Mashu from "./utils/MashuClient";
import CommandHandler from "./utils/CommandHandler";
import CommandLoader from "./utils/CommandLoader";
import EventLoader from "./utils/EventLoader";
import Logger from "./utils/Logger";
import Users from "./models/Users";
import { updateMemberCount } from "./utils/Utils";

// Whether the bot is ready or not
let ready = false;

const logger = new Logger();

// Initialize discord client
const client = new Mashu(logger, settings.token, { getAllUsers: true, restMode: true });

// Initialize command loader/handler and event loader
const commandLoader = new CommandLoader(client);
const commandHandler = new CommandHandler(client);
const eventLoader = new EventLoader(client);

const interval = new Yukikaze();

/** Start the interval to check the db for expired mute dates */
function startDBInterval(): void {
    logger.info("INTERVAL", "Interval started");
    interval.run(async () => {
        const users = await Users.find({}).exec();
        for (const user of users) {
            if (user.expireAt) {
                const now = moment(Date.now()).utc().toDate();
                if (user.expireAt < now) {
                    const guild = client.guilds.get(settings.options.guild);
                    if (guild) {
                        const guser = guild.members.get(user.id);
                        if (guser) {
                            await guser.removeRole(settings.options.muteRole, "[UNMUTE] Mute reached expiration date");
                            user.isMuted = false;
                            user.expireAt = undefined;
                            await Users.updateOne({ id: user.id }, user).exec();
                        } else {
                            // User not in server anymore
                            // This will set it to unlimited time, when the user joins the server again it will assign the mute role again
                            // The moderators will have to remove the role manually or mute the user again with a new expiration date
                            user.expireAt = undefined;
                            await Users.updateOne({ id: user.id }, user).exec();
                        }
                    } else {
                        logger.warn("INTERVAL", "Bot not in server");
                    }
                }
            }
        }
    }, 60000); // Every minute
}

client.on("ready", async () => {
    if (!ready) {
        // Connect to mongodb
        await mongoose.connect(`mongodb://${settings.database.user}:${settings.database.pwd}@${settings.database.host}:${settings.database.port}/${settings.database.name}`, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false
        });

        // Load commands
        client.commands = await commandLoader.load(path.join(__dirname, "commands"));

        // Start db interval if none is active
        if (!interval.active) startDBInterval();

        logger.ready(`Logged in as ${client.user.tag}`);
        logger.ready(`Loaded [${client.commands.size}] commands`);

        client.editStatus("online", { name: "my master", type: 3 });

        ready = true;

        const guild = client.guilds.get(settings.options.guild);
        if (guild) {
            await updateMemberCount(client, guild);
        }
    } else {
        // Start db interval if none is active
        if (!interval.active) startDBInterval();
        logger.ready("Client reconnected");
    }
});

// Handle commands
client.on("messageCreate", async (msg) => {
    if (!ready) return; // Bot not ready yet
    if (!msg.author) return; // Probably system message
    if (msg.author.discriminator === "0000") return; // Probably a webhook
    if (msg.author.id === client.user.id) return;

    client.stats.messagesSeen++;

    // If message starts with our prefix check if it's a valid command, then execute the command if valid
    if (msg.content.startsWith(settings.prefix)) {
        if (msg.channel.isGuildChannel) {
            await commandHandler.handleCommand(msg, false);
        } else if (msg.channel.isPrivateChannel) {
            await commandHandler.handleCommand(msg, true);
        }
    }
});

// Handle disconnects
client.on("disconnect", () => {
    logger.warn("DISCONNECT", "Client disconnected");
    interval.stop();
});

/**
 * Sometimes when a shard goes down for a moment and comes back up is loses it's status
 * so we re-add it here
 */
client.on("shardResume", (id: number) => {
    const shard = client.shards.get(id);
    if (shard) {
        shard.editStatus("online", { name: "my master", type: 3 });
    }
});

process.on("unhandledRejection", (reason) => {
    logger.error("UNHANDLED_REJECTION", reason as any);
});

process.on("uncaughtException", (e) => {
    logger.error("UNCAUGHT_EXCEPTION", e);
});

process.on("SIGINT", () => {
    if (interval.active) {
        interval.stop();
    }
    client.disconnect({ reconnect: false });
    process.exit(0);
});

async function main(): Promise<void> {
    await eventLoader.load(path.join(__dirname, "events"));
    client.connect().catch((e) => logger.error("CONNECT", e));
}

main().catch((e) => logger.error("MAIN", e));
