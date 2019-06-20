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

let ready = false;
let dbInterval: NodeJS.Timeout | null = null;

const client = new Mashu(settings.token, {
    getAllUsers: true,
    restMode: true
});

const logger = new Logger();
const commandLoader = new CommandLoader(logger);
const commandHandler = new CommandHandler({ settings, client, logger });

function startDBInterval(): NodeJS.Timeout {
    logger.info("INTERVAL", "Interval started");
    return setInterval(async () => {
        const guilds = await GuildModel.find({}).exec();
        for (let i = 0; i < guilds.length; i++) {
            for (let j = 0; j < guilds[i].users.length; j++) {
                const user = guilds[i].users[j];
                if (user.expireAt) {
                    const now = moment(Date.now()).utc().toDate();
                    if (user.expireAt < now) {
                        const guild = client.guilds.get(guilds[i].id);
                        if (guild) {
                            const guser = guild.members.get(guilds[i].users[j].id);
                            if (guser) {
                                guser.removeRole(guilds[i].muteRole, "Mute reached expiration date");
                                user.isMuted = false;
                                user.expireAt = undefined;
                                guilds[i].users[j] = user;
                                await GuildModel.updateOne({ "id": guilds[i].id }, guilds[i]).exec();
                            }
                        }
                    }
                }
            }
        }
    }, 60000); // Every minute
}

client.on("ready", async () => {
    if (!ready) {
        await mongoose.connect(`mongodb://${settings.database.host}:${settings.database.port}/${settings.database.name}`, { useNewUrlParser: true });
        client.commands = await commandLoader.load(`${__dirname}/commands`);

        if (!dbInterval) dbInterval = startDBInterval();

        logger.ready(`Logged in as ${client.user.tag}`);
        logger.ready(`Loaded [${client.commands.size}] commands`);

        ready = true;
    } else {
        if (!dbInterval) dbInterval = startDBInterval();
        logger.ready("Client reconnected");
    }
});

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

    if (msg.content.startsWith(settings.prefix)) {
        if (isGuildChannel(msg.channel) && msg.author.id !== client.user.id) {
            await commandHandler.handleCommand(msg, false);
        } else if (msg.channel.type === 1) {
            await commandHandler.handleCommand(msg, true);
        }
    }
});

client.on("guildCreate", async (guild: Guild) => {
    const newGuild = new GuildModel({ "id": guild.id, "logChannel": "" });
    await newGuild.save();
});

client.on("channelCreate", async (channel: AnyChannel) => {
    if (isGuildChannel(channel)) {
        channel = channel as AnyGuildChannel;
        const guild = await GuildModel.findOne({ "id": channel.guild.id }).exec();
        if (guild && guild.muteRole) {
            await channel.editPermission(guild.muteRole, 0, 55360, "role", "Create muted overrides");
        }
    }
});

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

client.connect().catch((e) => logger.error("CONNECT", e.stack));
