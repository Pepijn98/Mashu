import ts from "typescript";
import util from "util";
import settings from "~/settings";
import Command from "~/Command";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as utils from "~/utils/Utils";
import { Message } from "eris";
import { ICommandContext } from "~/types/ICommandContext";

export default class extends Command {
    constructor(category: string) {
        super({
            name: "eval",
            description: "Evaluate javascript code",
            usage: "eval <code: string>",
            example: "eval 1 + 1",
            category,
            ownerOnly: true,
            requiredArgs: 1
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async run(msg: Message, args: string[], ctx: ICommandContext): Promise<void> {
        let isTypescript = false;
        let content = msg.content.replace(`${settings.prefix}eval`, "").replace(/^\s+/, "").replace(/\s*$/, "");

        if (content.startsWith("```") && content.endsWith("```")) {
            content = content.substring(3, content.length - 3);
            if (content.startsWith("ts")) {
                isTypescript = true;
                content = content.substr(2);
            } else if (content.startsWith("js")) {
                content = content.substr(2);
            }
        }

        const console: any = {
            _lines: [],
            _logger(...things: any[]) {
                this._lines.push(...things.join(" ").split("\n"));
            },
            _formatLines() {
                return this._lines.map((line: any) => line && `//> ${line}\n`).join("");
            }
        };
        console.log = console.error = console.warn = console.info = console._logger.bind(console);
        const compilerOptions: ts.CompilerOptions = {
            baseUrl: "",
            module: ts.ModuleKind.CommonJS,
            strict: false,
            esModuleInterop: true,
            target: ts.ScriptTarget.ESNext,
            noImplicitAny: true,
            moduleResolution: ts.ModuleResolutionKind.NodeJs,
            sourceMap: false,
            noImplicitReturns: false,
            resolveJsonModule: true,
            declaration: false,
            outDir: "build",
            typeRoots: ["src/@types"]
        };

        let result;
        try {
            if (isTypescript) {
                content = ts.transpile(content, compilerOptions);
            }
            result = eval(content);
        } catch (error) {
            result = error;
        }
        const message = `\`\`\`js\n${console._formatLines()}${util.inspect(result, { depth: 1 })}\n\`\`\``;

        let outputMsg;
        try {
            outputMsg = await msg.channel.createMessage(message);
        } catch (error) {
            msg.channel.createMessage(`\`\`\`diff\n- ${error}\`\`\``).catch(() => {});
            return;
        }

        if (result && typeof result.then === "function") {
            let value;
            try {
                value = util.inspect(await result, { depth: 1 });
            } catch (err) {
                value = err;
            }

            const newContent = outputMsg.content.split("\n");
            newContent.splice(-1, 0, "// Resolved to:", value);
            try {
                await outputMsg.edit(newContent.join("\n"));
            } catch (_) {
                newContent.splice(-2, 1, "(content too long)");
                outputMsg.edit(newContent.join("\n")).catch(() => {});
            }
        }
    }
}
