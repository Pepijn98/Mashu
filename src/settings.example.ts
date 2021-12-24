import yn from "~/utils/yn";
import Settings from "~/types/Settings";

const debug = yn(process.env.DEBUG, false);
const env = process.env.NODE_ENV === "production" ? "production" : "development";

const token = "";
const devToken = "";

const settings: Settings = {
    env,
    debug,
    token: env === "production" ? token : devToken,
    owner: "",
    prefix: "//",
    colors: {
        default: 0xf0dee0,
        error: 0xdc143c,
        ban: 0xd10029,
        unban: 0x77bc00,
        warn: 0xeaab24,
        kick: 0xf43900,
        mute: 0xeadc24,
        unmute: 0x77bc00,
        accepted: 0x65c875,
        denied: 0xee5168
    },
    database: {
        host: "localhost",
        name: "",
        user: "",
        pwd: ""
    },
    options: {
        guild: "",
        muteRole: "",
        memberRole: "",
        logChannel: "",
        suggestionChannel: "",
        memberCountChannel: "",
        welcomeChannel: "",
        notifyCreator: true
    }
};

export default settings;
