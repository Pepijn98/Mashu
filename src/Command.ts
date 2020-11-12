import Users from "./models/Users";
import { Message, Member, GuildChannel } from "eris";
import { ICommandOptions } from "./types/CommandOptions";
import { ICommandContext } from "./types/ICommandContext";
import { MongooseArray } from "./types/mongo/Utils";
import { IUser, UserDoc } from "./types/mongo/Users";
import { Permission } from "~/utils/Utils";

export default abstract class Command {
    _key: string; // Collection id

    name: string;
    description: string;
    usage: string;
    example: string;
    subCommands: string[];
    category: string;
    aliases: string[];
    hidden: boolean;
    guildOnly: boolean;
    ownerOnly: boolean;
    requiredArgs: number;
    userPermissions: Permission[];
    botPermissions: Permission[];

    constructor(options: ICommandOptions) {
        this._key = options.name;

        this.name = options.name;
        this.description = options.description;
        this.usage = options.usage;
        this.example = options.example;
        this.subCommands = options.subCommands || [];
        this.category = options.category || "general";
        this.aliases = options.aliases || [];
        this.hidden = options.hidden || false;
        this.guildOnly = options.guildOnly || false;
        this.ownerOnly = options.ownerOnly || false;
        this.requiredArgs = options.requiredArgs || 0;
        this.userPermissions = options.userPermissions || ["sendMessages"];
        this.botPermissions = options.botPermissions || ["readMessages", "sendMessages"];
    }

    /** Function with all the stuff the command needs to do */
    public abstract run(msg: Message, args: string[], context: ICommandContext): Promise<any>;

    /** Tries to find the user in the current guild */
    findMember(channel: GuildChannel, uid: string): Member | undefined {
        if (/^\d{17,18}/u.test(uid) || /^<@!?\d{17,18}>/u.test(uid)) {
            return channel.guild.members.get(/^<@!?\d{17,18}>/u.test(uid) ? uid.replace(/<@!?/u, "").replace(">", "") : uid);
        } else if (uid.length <= 33) {
            const isMemberName = (name: string, something: string): boolean => name === something || name.startsWith(something) || name.includes(something);
            return channel.guild.members.find((m) =>
                m.nick && isMemberName(m.nick.toLowerCase(), uid.toLowerCase()) ? true : isMemberName(m.user.username.toLowerCase(), uid.toLowerCase())
            );
        }
    }

    /** Generate violation ID, [ban, kick, warn, note] */
    generateId(): string {
        return `_${Math.random().toString(36).substr(2, 9)}`;
    }

    createDBUser(id: string): UserDoc {
        return new Users({
            id,
            isBanned: false,
            isMuted: false,
            warns: new MongooseArray(),
            bans: new MongooseArray(),
            kicks: new MongooseArray(),
            notes: new MongooseArray()
        } as IUser);
    }
}
