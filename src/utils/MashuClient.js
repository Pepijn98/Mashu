const { Client } = require("eris");

class Mashu extends Client {
    constructor(token, options) {
        super(token, options);

        this.activeMessages = {};

        this.on("messageReactionAdd", this.onMessageReactionEvent);
        this.on("messageReactionRemove", this.onMessageReactionEvent);
    }

    async onMessageReactionEvent(msg, emoji, userID) {
        if (!this.ready || userID === this.user.id || !(msg.content || msg.embeds || msg.attachments)) {
            return;
        }

        emoji = emoji.id ? `${emoji.name}:${emoji.id}` : emoji.name;

        const activeMessage = this.activeMessages[msg.id];
        if (activeMessage && activeMessage.reactionButtons) {
            const action = activeMessage.reactionButtons.find((button) => button.emoji === emoji);
            if (!action) return;

            switch (action.type) {
                case "cancel":
                    await this.unwatchMessage(msg.id, msg.channel.guild && msg.channel.id);
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

    async unwatchMessage(id, channelId) {
        Reflect.deleteProperty(this.activeMessages, id);

        if (channelId) {
            await this.removeMessageReactions(channelId, id);
        }
    }

    async reactionButtonMessage(msg, messageQueue, reactionButtonTimeout, queueIndex, reactionButtons) {
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

module.exports = Mashu;
