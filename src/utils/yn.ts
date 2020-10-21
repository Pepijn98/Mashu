// Signature 1
function yn(input: unknown, default_: boolean): boolean;
// Signature 2
function yn(input: unknown, default_?: boolean): boolean | undefined;
// Implementation of both signatures (aka: implementation signature)
function yn(input: unknown, default_?: boolean): boolean | undefined {
    const value = String(input).trim();

    if (/^(?:y|yes|true|1|on)$/i.test(value)) {
        return true;
    }

    if (/^(?:n|no|false|0|off)$/i.test(value)) {
        return false;
    }

    return default_;
}

export default yn;
