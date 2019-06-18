import { ISettings } from "./src/interfaces/ISettings";

const settings: ISettings = {
    token: "NDE5NjQyMDAxNDI0NjQ2MTQ1.XKURLA.E-TmD10x-p2uDCMHAirW8sh5hhU",
    owner: "93973697643155456",
    prefix: "m/",
    colors: {
        default: 0xF0DEE0,
        error: 0xDC143C,
        ban: 0xD10029,
        unban: 0x77BC00,
        warn: 0xEAAB24,
        kick: 0xF43900,
        mute: 0xEADC24,
        unmute: 0x77BC00
    },
    database: {
        host: "localhost",
        port: 27017,
        name: "mashu"
    }
};

export default settings;
