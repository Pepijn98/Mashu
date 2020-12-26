import settings from "~/settings";
import Users from "~/models/Users";
import Event from "~/types/IEvent";
import Mashu from "~/utils/MashuClient";
import { Guild, Member } from "eris";
import { isGuildTextChannel, updateMemberCount, sleep, urlRegex } from "~/utils/Utils";

async function advertDetection(guild: Guild, member: Member): Promise<void> {
    await member.ban(7, "[auto detected] Advertisement in username");
    await sleep(1000);

    const channel = guild.channels.get(settings.options.welcomeChannel);
    if (channel && isGuildTextChannel(channel)) {
        const messages = await channel.getMessages();
        const message = messages.find((m) => m.mentions.length > 0 && m.mentions[0].id === member.id);
        if (message) {
            await message.delete("[auto detected] Advertisement in username");
        }
    }
}

async function sendWelcome(client: Mashu, guild: Guild, member: Member): Promise<void> {
    await client.createMessage(settings.options.welcomeChannel, {
        content: member.mention,
        embed: {
            color: Math.floor(Math.random() * 16777215),
            description: `Welcome to **${guild.name}**, make sure to read <#240154456577015808>`,
            image: {
                url: "https://b.catgirlsare.sexy/U-mh_8Ye.gif"
            },
            fields: [
                {
                    name: "Member Count",
                    value: `#${guild.memberCount}`
                }
            ],
            timestamp: new Date(member.joinedAt)
        }
    });
}

async function muteDetection(client: Mashu, member: Member): Promise<void> {
    if (settings.options.muteRole && !member.pending) {
        const user = await Users.findOne({ id: member.user.id }).exec();
        if (user && user.isMuted) {
            const reason = "Member left while being muted, re-added mute role until a moderator unmutes the member";
            if (settings.options.logChannel) {
                await client.createMessage(settings.options.logChannel, {
                    embed: {
                        title: "MUTE",
                        color: settings.colors.mute,
                        description: `**Muted:** ${member.user.mention}\n` + `**By:** ${client.user.mention}\n` + `**Reason:** ${reason}`,
                        timestamp: new Date(),
                        footer: { text: `ID: ${member.user.id}` }
                    }
                });
            }

            await member.addRole(settings.options.muteRole, `[MUTED] ${reason}`);
        }
    }
}

/** Handle muted members trying to re-join the server and users with urls in their name */
export const event: Event = {
    name: "guildMemberAdd",
    run: async (client, guild: Guild, member: Member) => {
        if (guild.id !== settings.options.guild) return;
        const hasUrlUsername = member.username.match(urlRegex);
        if (hasUrlUsername) {
            await advertDetection(guild, member);
        } else {
            await sendWelcome(client, guild, member);
            await muteDetection(client, member);
            await updateMemberCount(client, guild);
        }
    }
};

export default event;
