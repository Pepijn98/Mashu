import { IMessageCollectorOptions } from "src/interfaces/Options";
import { isGuildChannel } from "./Helpers";
import { EventEmitter } from "events";
import { AnyChannel, Channel, User, Member, Message, Client, AnyGuildChannel } from "eris";

export class MessageCollector extends EventEmitter {
    public filter: (message: Message) => boolean;
    public channel: AnyChannel;
    public options: IMessageCollectorOptions;
    public ended: boolean;
    public collected: Message[];
    public bot: Client;
    public listener: (message: Message) => any;

    public constructor(channel: AnyChannel, filter: (message: Message) => boolean, options: IMessageCollectorOptions) {
        super();
        this.filter = filter;
        this.channel = channel;
        this.options = options || {};
        this.ended = false;
        this.collected = [];
        this.bot = isGuildChannel(channel) && (channel as AnyGuildChannel).guild ? (channel as AnyGuildChannel).guild.shard.client : (channel as any)._client;

        this.listener = (message) => this.verify(message);
        this.bot.on("messageCreate", this.listener);
        if (options.time) setTimeout(() => this.stop("time"), options.time);
    }

    public verify(message: Message): boolean {
        if (this.channel.id !== message.channel.id) return false;
        if (this.filter(message)) {
            this.collected.push(message);
            this.emit("message", message);
            if (this.collected.length >= this.options.maxMatches) this.stop("maxMatches");
            return true;
        }
        return false;
    }

    public stop(reason: string): void {
        if (this.ended) return;
        this.ended = true;
        this.bot.removeListener("messageCreate", this.listener);
        this.emit("end", this.collected, reason);
    }
}

// eslint-disable-next-line no-extend-native
String.prototype.capitalize = function(): string {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

// eslint-disable-next-line no-extend-native
Array.prototype.paginate = function(pageSize: number, pageNumber: number): any[] {
    --pageNumber;
    return this.slice(pageNumber * pageSize, (pageNumber + 1) * pageSize);
};

Channel.prototype.awaitMessages = function(filter, options) {
    const collector = new MessageCollector(this as AnyChannel, filter, options);
    return new Promise((resolve) => collector.on("end", resolve));
};

Object.defineProperty(User.prototype, "tag", {
    get: function() {
        return `${this.username}#${this.discriminator}`;
    }
});

Object.defineProperty(Member.prototype, "tag", {
    get: function() {
        return `${this.username}#${this.discriminator}`;
    }
});
