import Collection from "@kurozero/collection";
import Command from "~/Command";
import Logger from "./Logger";
import { isGuildChannel } from "./Utils";
import { ICommandStats } from "~/types/CommandOptions";
import { IActiveMessage, IReactionButton } from "~/types/ActiveMessage";
import { Client, Message, Emoji, ClientOptions } from "eris";

export default class Mashu extends Client {
    logger: Logger;
    commands: Collection<Command>;
    activeMessages: Record<string, IActiveMessage>; // TODO: Maybe use a Collection for this
    stats: ICommandStats;
    ready = false;

    constructor(logger: Logger, token: string, options: ClientOptions) {
        super(token, options);

        this.logger = logger;
        this.commands = new Collection(Command);
        this.activeMessages = {};
        this.stats = {
            commandsExecuted: 0,
            messagesSeen: 0,
            commandUsage: {}
        };

        this.on("messageReactionAdd", this.onMessageReactionEvent);
        this.on("messageReactionRemove", this.onMessageReactionEvent);
    }

    /** Handle reactions added/removed for a paginated message */
    async onMessageReactionEvent(msg: Message, emoji: Emoji, userID: string): Promise<void> {
        if (!this.ready || userID === this.user.id || !(msg.content || msg.embeds || msg.attachments)) {
            return;
        }

        const emojiString = emoji.id ? `${emoji.name}:${emoji.id}` : emoji.name;

        const activeMessage = this.activeMessages[msg.id];
        if (activeMessage && activeMessage.reactionButtons) {
            const action = activeMessage.reactionButtons.find((button) => button.emoji === emojiString);
            if (!action) return;

            switch (action.type) {
                case "cancel":
                    if (isGuildChannel(msg.channel)) {
                        await this.unwatchMessage(msg.id, msg.channel.guild && msg.channel.id);
                    }
                    break;
                case "next":
                    activeMessage.queueIndex++;
                    if (activeMessage.queueIndex > activeMessage.messageQueue.length - 1) activeMessage.queueIndex--;
                    await activeMessage.self.edit(activeMessage.messageQueue[activeMessage.queueIndex]);
                    break;
                case "previous":
                    activeMessage.queueIndex--;
                    if (activeMessage.queueIndex < 0) activeMessage.queueIndex = 0;
                    await activeMessage.self.edit(activeMessage.messageQueue[activeMessage.queueIndex]);
                    break;
                case "first":
                    activeMessage.queueIndex = 0;
                    await activeMessage.self.edit(activeMessage.messageQueue[activeMessage.queueIndex]);
                    break;
                case "last":
                    activeMessage.queueIndex = activeMessage.messageQueue.length - 1;
                    await activeMessage.self.edit(activeMessage.messageQueue[activeMessage.queueIndex]);
                    break;
                default:
                    break;
            }
        }
    }

    /** Remove message from active messages */
    async unwatchMessage(id: string, channelId: string): Promise<void> {
        Reflect.deleteProperty(this.activeMessages, id);
        if (channelId) {
            await this.removeMessageReactions(channelId, id);
        }
    }

    /** Create a message with reaction buttons */
    async reactionButtonMessage(msg: Message, messageQueue: string[], reactionButtonTimeout: number, queueIndex: number, reactionButtons: IReactionButton[]): Promise<void> {
        const self = await this.createMessage(msg.channel.id, messageQueue[queueIndex]);

        reactionButtons.forEach((button) => self.addReaction(button.emoji));
        this.activeMessages[self.id] = {
            reactionButtons,
            reactionButtonTimeout,
            messageQueue,
            queueIndex,
            self,
            timeout: setTimeout(async () => {
                await this.unwatchMessage(self.id, self.channel.id);
            }, reactionButtonTimeout)
        };
    }
}
