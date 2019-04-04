const sleep = async (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = {
    sleep
};
