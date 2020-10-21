import chalk from "chalk";
import settings from "~/settings";
import moment from "moment";
import { Logger as WinstonLogger, createLogger, format, transports } from "winston";

/** Custom logger, you know, this logs stuff to the terminal with pretty colors and timestamps :O */
export default class Logger {
    #log: WinstonLogger;

    constructor() {
        this.#log = createLogger({
            level: "warn",
            format: format.combine(
                format.timestamp(),
                format.printf(
                    (log) => `${moment(log.timestamp).format("DD/MM/YYYY, hh:mm:ss")} ${chalk.black.bgGreen(`[${log.label}]`)} ${this._getColored(log.level)}: ${log.message}`
                )
            ),
            transports: [
                new transports.Console({
                    level: settings.debug ? "debug" : "info"
                })
            ]
        });
    }

    ready(message: string): void {
        this.#log.info(message, { label: "READY" });
    }

    debug(label: string, message: string): void {
        if (settings.debug) {
            this.#log.debug(message, { label });
        }
    }

    info(label: string, message: string): void {
        this.#log.info(message, { label });
    }

    warn(label: string, message: string): void {
        this.#log.warn(message, { label });
    }

    error(label: string, error: Error | string = "Unknown Error"): void {
        if (error instanceof Error) {
            this.#log.error(error.stack ? error.stack : error.toString(), { label });
        } else {
            this.#log.error(error, { label });
        }
    }

    private _getColored(logLevel: string): string {
        if (logLevel === "error") {
            return chalk.red.bold(logLevel);
        } else if (logLevel === "warn") {
            return chalk.yellow.bold(logLevel);
        } else if (logLevel === "info") {
            return chalk.blue.bold(logLevel);
        }

        return chalk.white(logLevel);
    }
}
