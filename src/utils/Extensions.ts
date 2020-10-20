import { IMessageCollectorOptions } from "../types/CommandOptions";
import { EventEmitter } from "events";
import { AnyChannel, Channel, User, Member, Message, Client, AnyGuildChannel } from "eris";
import { isGuildChannel, isPrivateChannel } from "./Utils";

/** A message collector for awaiting messages */
export class MessageCollector extends EventEmitter {
    filter: (message: Message) => boolean;
    channel: AnyChannel;
    options: IMessageCollectorOptions;
    ended: boolean;
    collected: Message[];
    bot: Client;
    listener: (message: Message) => any;

    constructor(channel: AnyChannel, filter: (message: Message) => boolean, options: IMessageCollectorOptions) {
        super();
        this.filter = filter;
        this.channel = channel;
        this.options = options;
        this.ended = false;
        this.collected = [];
        this.bot = channel.isGuildChannel && (channel as AnyGuildChannel).guild ? (channel as AnyGuildChannel).guild.shard.client : (channel as any)._client;

        this.listener = (message) => this.verify(message);
        this.bot.on("messageCreate", this.listener);
        if (options.time) setTimeout(() => this.stop("time"), options.time);
    }

    verify(message: Message): boolean {
        if (this.channel.id !== message.channel.id) return false;
        if (this.filter(message)) {
            this.collected.push(message);
            this.emit("message", message);
            if (this.collected.length >= this.options.maxMatches) this.stop("maxMatches");
            return true;
        }
        return false;
    }

    stop(reason: string): void {
        if (this.ended) return;
        this.ended = true;
        this.bot.removeListener("messageCreate", this.listener);
        this.emit("end", this.collected, reason);
    }
}

/** Capitalize the first letter of a string */
String.prototype.capitalize = function (): string {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

/** Paginate over an array */
Array.prototype.paginate = function <T>(pageSize: number, pageNumber: number): T[] {
    --pageNumber;
    return this.slice(pageNumber * pageSize, (pageNumber + 1) * pageSize);
};

/** Remove item from array (modifies the current array AND returns it) */
Array.prototype.remove = function <T>(item: T): T[] {
    for (let i = 0; i < this.length; i++) {
        if (this[i] === item) this.splice(i, 1);
    }
    return this;
};

/** Wait for a certain message/messages from a user */
Channel.prototype.awaitMessages = function (filter: (message: Message) => boolean, options: IMessageCollectorOptions) {
    const collector = new MessageCollector(this as AnyChannel, filter, options);
    return new Promise((resolve) => collector.on("end", resolve));
};

Object.defineProperty(Channel.prototype, "isGuildChannel", {
    get: function () {
        return isGuildChannel(this);
    }
});

Object.defineProperty(Channel.prototype, "isDMChannel", {
    get: function () {
        return this.isPrivateChannel;
    }
});

Object.defineProperty(Channel.prototype, "isPrivateChannel", {
    get: function () {
        return isPrivateChannel(this);
    }
});

Object.defineProperty(User.prototype, "tag", {
    get: function () {
        return `${this.username}#${this.discriminator}`;
    }
});

Object.defineProperty(Member.prototype, "tag", {
    get: function () {
        return `${this.username}#${this.discriminator}`;
    }
});
