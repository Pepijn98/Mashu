const { Client } = require("eris");

class Chloe extends Client {
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
            if (!action) {
                return console.log("No action found");
            }

            let index = activeMessage.queueIndex;

            switch (action.type) {
            case "cancel":
                await this.unwatchMessage(msg.id, msg.channel.guild && msg.channel.id);
                break;
            case "next":
                index++;
                if (index > activeMessage.messageQueue.length - 1) return;
                await this.editMessage(activeMessage.botmsg.channel.id, activeMessage.botmsg.id, activeMessage.messageQueue[index]);
                break;
            case "previous":
                index--;
                if (index < 0) index = 0;
                await this.editMessage(activeMessage.botmsg.channel.id, activeMessage.botmsg.id, activeMessage.messageQueue[index]);
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

    async reactionButtonMessage(msg, reactionButtons, reactionButtonTimeout, queueIndex, messageQueue) {
        let botmsg = await this.createMessage(msg.channel.id, messageQueue[queueIndex]);

        reactionButtons.forEach((button) => botmsg.addReaction(button.emoji));
        this.activeMessages[botmsg.id] = {
            reactionButtons,
            reactionButtonTimeout,
            messageQueue,
            queueIndex,
            botmsg,
            timeout: setTimeout(async () => {
                await this.unwatchMessage(botmsg.id, botmsg.channel.id);
            }, reactionButtonTimeout)
        };
    }
}

module.exports = Chloe;
