import Collection from "@kurozero/collection";
import Command from "../Command";
import { isGuildChannel } from "./Helpers";
import { IActiveMessage, IReactionButton } from "../interfaces/IActiveMessage";
import { Client, Message, Emoji, ClientOptions, AnyGuildChannel } from "eris";

export default class Mashu extends Client {
    public commands: Collection<Command>;
    public activeMessages: Record<string|number|symbol, IActiveMessage>; // TODO: Maybe use a Collection for this
    public ready: boolean = false;

    public constructor(token: string, options: ClientOptions) {
        super(token, options);

        this.commands = new Collection(Command);
        this.activeMessages = {};

        this.on("messageReactionAdd", this.onMessageReactionEvent);
        this.on("messageReactionRemove", this.onMessageReactionEvent);
    }

    /** Handle reactions added/removed for a paginated message */
    public async onMessageReactionEvent(msg: Message, emoji: Emoji, userID: string): Promise<void> {
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
                        const channel = (msg.channel as AnyGuildChannel);
                        await this.unwatchMessage(msg.id, channel.guild && msg.channel.id);
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
    public async unwatchMessage(id: string, channelId: string): Promise<void> {
        Reflect.deleteProperty(this.activeMessages, id);
        if (channelId) {
            await this.removeMessageReactions(channelId, id);
        }
    }

    /** Create a message with reaction buttons */
    public async reactionButtonMessage(
        msg: Message,
        messageQueue: string[],
        reactionButtonTimeout: number,
        queueIndex: number,
        reactionButtons: IReactionButton[]
    ): Promise<void> {
        let self = await this.createMessage(msg.channel.id, messageQueue[queueIndex]);

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
