const { createLogger, format, transports } = require("winston");
const chalk = require("chalk");
const moment = require("moment");

const colors = {
    "error": "red",
    "warn": "yellow",
    "info": "blue"
};

class Logger {
    constructor() {
        this.log = createLogger({
            level: "info",
            format: format.combine(
                format.timestamp(),
                format.printf((log) => `${moment(log.timestamp).format("DD/MM/YYYY, hh:mm:ss")} ${chalk.black.bgGreen(`[${log.label}]`)} ${chalk[colors[log.level]].bold(log.level)}: ${log.message}`)
            ),
            transports: [new transports.Console()]
        });
    }

    ready(message) {
        this.log.info(message, { label: "READY" });
    }

    info(label, message) {
        this.log.info(message, { label });
    }

    warn(label, message) {
        this.log.warn(message, { label });
    }

    error(label, message) {
        this.log.error(message, { label });
    }
}

module.exports = Logger;
