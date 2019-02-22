/**
 * Tries to find the user in the currently guild
 *
 * @param {Eris.Message} msg
 * @param {string} str
 */
const findMember = (msg, str) => {
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
};

module.exports = {
    findMember
};

