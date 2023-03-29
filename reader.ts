export function parseOutput(text: string, cb: (erorr: any, res:any) => void) {
    if (!text) {
        return cb(new Error("No input!"), null);
    }
    var lines = text.split("\n");
    var result = {};
    var stack = [result];
    var inManifest = false;

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];

        // Skip until we find the manifest
        if (line.trim() === "Android manifest:") {
            inManifest = true;
            continue;
        }
        if (!inManifest) {
            continue;
        }

        // Skip whitespace
        if (line.trim() === "") {
            continue;
        }

        // Match the first part of the line
        if (line.match(/^N:/)) {
            continue;
        }

        var matches = line.match(/^( +)(A|E): ([\w:\-]+)(.*)$/);
        if (!matches) {
            return cb(new Error("Parse failure: " + line), null);
        }
        var input = matches[0];
        var indent = matches[1];
        var type = matches[2];
        var name = matches[3];
        var rest = matches[4];

        var depth = indent.length / 2;
        var parent = stack[depth - 1];

        if (type === "E") {
            var element = {};

            // Fix stack
            while (stack.length > depth) {
                stack.pop();
            }
            if (depth === stack.length) {
                stack.push(element);
            }
            //@ts-ignore
            if (!parent[name]) {
                //@ts-ignore
                parent[name] = [];
            }
            //@ts-ignore
            parent[name].push(element);
        } else if (type === "A") {
            var value = null;
            if (rest.substring(0, 2) === "=\"") {
                // Embedded string
                value = extractRaw(rest.substring(1));
            } else if (rest.substring(0, 12) === "=(type 0x12)") {
                // Boolean
                value = rest[14] === "1";
            } else if (rest.substring(0, 12) === "=(type 0x10)") {
                // Raw
                value = extractRawType(rest);
                if (!value) {
                    return cb(new Error("Cannot parse value: " + rest), null);
                }
            } else if (rest.substring(0, 11) === "=(type 0x4)") {
                // Raw
                value = extractRawType(rest);
                if (!value) {
                    return cb(new Error("Cannot parse value: " + rest), null);
                }
            } else {
                var parts = rest.match(/^\(0x[0-9a-f]+\)\=(.*)$/);
                if (!parts) {
                    return cb(new Error("Cannot parse value: " + rest), null);
                }

                if (parts[1][0] === "\"") {
                    // Linked string
                    value = extractRaw(parts[1]);
                } else {
                    // No idea, get the raw hex value
                    if (parts[1].substring(0, 11) === "(type 0x10)") {
                        value = parseInt(parts[1].substring(13), 16);
                    } else {
                        value = parts[1];
                    }
                }
            }
            //@ts-ignore
            parent["@" + name] = value;
        } else {
            return cb(new Error("Unknown type: " + type), null);
        }
    }
    cb(null, result);
}

function extractRaw(str: string) {
    var sep = "\" (Raw: \"";
    var parts = str.split(sep);
    var value = parts.slice(0, parts.length / 2).join(sep);
    return value.substring(1);
}

function extractRawType(str: string) {
    var matches = str.match(/\(Raw:\s\"(.+)\"\)/);

    if (matches && matches.length > 1) {
        return matches[1];
    }
    return null;
}

