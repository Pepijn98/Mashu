import Mashu from "./MashuClient";
import Logger from "../utils/Logger";
import { GuildModel } from "./Mongoose";
import { ISettings } from "../interfaces/ISettings";
import { ICommandHandlerOptions } from "../interfaces/Options";
import { Message, AnyGuildChannel, User } from "eris";
import { Collection } from "@kurozero/collection";

export default class CommandHandler {
    public settings: ISettings;
    public client: Mashu;
    public logger: Logger;

    public constructor(options: ICommandHandlerOptions) {
        this.settings = options.settings;
        this.client = options.client;
        this.logger = options.logger;
    }

    public async handleCommand(msg: Message, dm: boolean): Promise<boolean | undefined> {
        const parts = msg.content.split(" ");
        const name = parts[0].slice(this.settings.prefix.length);

        const command = this.client.commands.find((cmd) => cmd.name === name || cmd.aliases.indexOf(name) !== -1);
        if (!command) return false; // Command doesn't exist

        this.client.stats.commandsExecuted++;
        this.client.stats.commandUsage[name] = this.client.stats.commandUsage[name] ? this.client.stats.commandUsage[name] : { size: 0, users: new Collection<User>(User) };
        this.client.stats.commandUsage[name].size++;
        this.client.stats.commandUsage[name].users.set(msg.author.id, msg.author);

        const args = parts.splice(1);
        const context = {
            settings: this.settings,
            logger: this.logger,
            database: {
                guild: GuildModel
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
                await msg.channel.createMessage(`Invalid argument count, check \`${this.settings.prefix}help ${command.name}\` to see how this command works.`);
            } catch (e) {}
            return false;
        }

        // Check if command is owner only
        if (command.ownerOnly && msg.author.id !== this.settings.owner) {
            try {
                await msg.channel.createMessage("Only the owner can execute this command.");
            } catch (e) {}
            return false;
        }

        // Only check for permission if the command is used in a guild
        if (msg.channel.isGuildChannel) {
            const channel = msg.channel as AnyGuildChannel;
            const botPermissions = command.botPermissions;
            if (botPermissions.length > 0) {
                const member = channel.guild.members.get(this.client.user.id);
                if (!member) return;
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
                const member = channel.guild.members.get(msg.author.id);
                if (!member) return;
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
            await command.run(msg, args, this.client, context);
            return true;
        } catch (error) {
            console.error(error);
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
}
