class Command {
    /**
     * The command options
     *
     * @param {Object} options
     * @param {string} options.name
     * @param {string} options.description
     * @param {string} options.usage
     * @param {Array<string>} [options.aliases=[]]
     * @param {boolean} [options.guildOnly=false]
     * @param {boolean} [options.ownerOnly=false]
     * @param {number} [options.requiredArgs=0]
     * @param {Array<string>} [options.userPermissions=["sendMessages"]]
     * @param {Array<string>} [options.botPermissions=["readMessages", "sendMessages"]]
     */
    constructor(options) {
        this.id = options.name; // Collection id

        this.name = options.name;
        this.description = options.description;
        this.usage = options.usage;
        this.category = options.category || "general";
        this.aliases = options.aliases || [];
        this.guildOnly = options.guildOnly || false;
        this.ownerOnly = options.ownerOnly || false;
        this.requiredArgs = options.requiredArgs || 0;
        this.userPermissions = options.userPermissions || ["sendMessages"];
        this.botPermissions = options.botPermissions || ["readMessages", "sendMessages"];
    }

    /**
     * Tries to find the user in the currently guild
     *
     * @param {Eris.Message} msg
     * @param {string} str
     */
    findMember(msg, str) {
        if (!str || str === "") return false;

        const guild = msg.channel.guild;
        if (!guild) return msg.mentions[0] ? msg.mentions[0] : false;

        if ((/^\d{17,18}/).test(str) || (/^<@!?\d{17,18}>/).test(str)) {
            const member = guild.members.get((/^<@!?\d{17,18}>/).test(str) ? str.replace(/<@!?/, "").replace(">", "") : str);
            return member ? member : false;
        } else if (str.length <= 33) {
            const isMemberName = (name, something) => name === something || name.startsWith(something) || name.includes(something);
            const member = guild.members.find((m) => (m.nick && isMemberName(m.nick.toLowerCase(), str.toLowerCase())) ? true : isMemberName(m.user.username.toLowerCase(), str.toLowerCase()));
            return member ? member : false;
        }

        return false;
    }

    generateId() {
        return `_${Math.random().toString(36).substr(2, 9)}`;
    }
}

module.exports = Command;
