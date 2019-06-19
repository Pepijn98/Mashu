import Mashu from "./utils/MashuClient";
import { ICommandOptions } from "./interfaces/Options";
import { isGuildChannel } from "./utils/Helpers";
import { ICommandContext } from "./interfaces/ICommandContext";
import { Message, Guild, AnyGuildChannel, Member } from "eris";

export default abstract class Command {
    public _key: string;

    public name: string;
    public description: string;
    public usage: string;
    public category: string;
    public aliases: string[];
    public hidden: boolean;
    public guildOnly: boolean
    public ownerOnly: boolean;
    public requiredArgs: number;
    public userPermissions: string[];
    public botPermissions: string[];

    public constructor(options: ICommandOptions) {
        this._key = options.name; // Collection id

        this.name = options.name;
        this.description = options.description;
        this.usage = options.usage;
        this.category = options.category || "general";
        this.aliases = options.aliases || [];
        this.hidden = options.hidden || false;
        this.guildOnly = options.guildOnly || false;
        this.ownerOnly = options.ownerOnly || false;
        this.requiredArgs = options.requiredArgs || 0;
        this.userPermissions = options.userPermissions || ["sendMessages"];
        this.botPermissions = options.botPermissions || ["readMessages", "sendMessages"];
    }

    public abstract async run(msg: Message, args: string[], client: Mashu, context: ICommandContext): Promise<any>;

    /** Tries to find the user in the currently guild */
    public findMember(msg: Message, str: string): false | Member {
        if (!str || str === "") return false;

        let guild: Guild | null = null;
        if (isGuildChannel(msg.channel))
            guild = (msg.channel as AnyGuildChannel).guild;

        if (!guild) return false;

        if ((/^\d{17,18}/u).test(str) || (/^<@!?\d{17,18}>/u).test(str)) {
            const member = guild.members.get((/^<@!?\d{17,18}>/u).test(str) ? str.replace(/<@!?/u, "").replace(">", "") : str);
            return member ? member : false;
        } else if (str.length <= 33) {
            const isMemberName = (name: string, something: string): boolean => name === something || name.startsWith(something) || name.includes(something);
            const member = guild.members.find((m) => (m.nick && isMemberName(m.nick.toLowerCase(), str.toLowerCase())) ? true : isMemberName(m.user.username.toLowerCase(), str.toLowerCase()));
            return member ? member : false;
        }

        return false;
    }

    public generateId(): string {
        return `_${Math.random().toString(36).substr(2, 9)}`;
    }
}
