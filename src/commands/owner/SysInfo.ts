import Command from "../../Command";
import os from "os-utils";
import { round, formatSeconds } from "../../utils/Helpers";
import { Message } from "eris";

export default class SysInfo extends Command {
    public constructor(category: string) {
        super({
            name: "sysinfo",
            description: "Info about the system the bot runs on",
            usage: "sysinfo",
            example: "sysinfo",
            category: category,
            ownerOnly: true
        });
    }

    public async run(msg: Message): Promise<void> {
        let cpuUsage = 0;
        os.cpuUsage((value: number) => cpuUsage = value);

        let cpuFree = 0;
        os.cpuFree((value: number) => cpuFree = value);

        const platform = os.platform();
        const cpuCount = os.cpuCount();
        const freemem = os.freemem();
        const totalmem = os.totalmem();
        const freememPercentage = os.freememPercentage();
        const sysUptime = os.sysUptime();
        const processUptime = os.processUptime();
        const loadavg = os.loadavg(1);

        setTimeout(() => {
            msg.channel.createMessage("```prolog\n" +
                `CPU Usage              -> ${round(cpuUsage * 100, 2)} %\n` +
                `CPU Free               -> ${round(cpuFree * 100, 2)} %\n` +
                `Platform               -> ${platform}\n` +
                `CPU Count              -> ${cpuCount}\n` +
                `Free Memory            -> ${round(freemem / 1000, 2)} GB\n` +
                `Total Memory           -> ${round(totalmem / 1000, 2)} GB\n` +
                `Free Memory Percentage -> ${round(freememPercentage * 100, 2)} %\n` +
                `System Uptime          -> ${formatSeconds(sysUptime)}\n` +
                `Process Uptime         -> ${formatSeconds(processUptime)}\n` +
                `Avg Load               -> ${loadavg}\n` +
                "```");
        }, 2000);
    }
}
