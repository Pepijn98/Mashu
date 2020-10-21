declare module "os-utils" {
    type Platform = "aix" | "android" | "darwin" | "freebsd" | "linux" | "openbsd" | "sunos" | "win32" | "cygwin";

    /**
     * returns platform.
     * @return Platform
     */
    function platform(): Platform;

    /**
     * returns number of cpus.
     * @return number
     */
    function cpuCount(): number;

    /**
     * returns system up time in seconds.
     * @return number
     */
    function sysUptime(): number;

    /**
     * returns process up time in seconds.
     * @return number
     */
    function processUptime(): number;

    /**
     * returns free memory in megabytes.
     * @return number
     */
    function freemem(): number;

    /**
     * returns total memory in megabytes.
     * @return number
     */
    function totalmem(): number;

    /**
     * returns the percentage of free memory.
     * @return number
     */
    function freememPercentage(): number;

    /**
     * execute free command (only linux).
     */
    function freeCommand(callback: (used_mem: number) => any): void;

    /**
     * execute df -k command.
     */
    function harddrive(callback: (total: number, free: number, used: number) => any): void;

    /**
     * return process running current.
     */
    function getProcesses(callback: (result: string) => any): void;

    /**
     * return process running current.
     */
    function getProcesses(nProcess: number, callback: (result: string) => any): void;

    /**
     * returns all the load average usage for 1, 5 or 15 minutes.
     * @return string
     */
    function allLoadavg(): string;

    /**
     * returns the load average usage for 1, 5 or 15 minutes.
     * @return number
     */
    function loadavg(_time?: number): number;

    /**
     * returns the free percentage of cpu usage.
     */
    function cpuFree(callback: (percentage: number) => any): void;

    /**
     * returns the percentage of cpu usage.
     */
    function cpuUsage(callback: (percentage: number) => any): void;
}
