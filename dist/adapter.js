Object.defineProperty(exports, "__esModule", { value: true });
exports.isMessagePort = exports.forward = exports.createEndpoint = void 0;
const webextension_polyfill_ts_1 = require("webextension-polyfill-ts");
const SYMBOL = "__PORT__@";
function _resolvePort(id, onPort) {
    onPort(webextension_polyfill_ts_1.browser.runtime.connect(undefined, { name: id }));
}
function _deserializePort(id) {
    const { port1, port2 } = new MessageChannel();
    forward(port1, webextension_polyfill_ts_1.browser.runtime.connect(undefined, { name: id }), _resolvePort, _deserializePort);
    return port2;
}
function createEndpoint(port, resolvePort = _resolvePort, deserializePort = _deserializePort) {
    const listeners = new WeakMap();
    function serialize(data) {
        if (Array.isArray(data)) {
            data.forEach((value, i) => {
                serialize(value);
            });
        }
        else if (data && typeof data === "object") {
            if (data instanceof MessagePort) {
                const id = SYMBOL + `${+new Date()}${Math.random()}`;
                data[SYMBOL] = "port";
                data.port = id;
                resolvePort(id, (port) => forward(data, port, resolvePort, deserializePort));
            }
            else if (data instanceof ArrayBuffer) {
                data[SYMBOL] =
                    data instanceof Uint8Array
                        ? "uint8"
                        : data instanceof Uint16Array
                            ? "uint16"
                            : data instanceof Uint32Array
                                ? "uint32"
                                : "buffer";
                data.blob = URL.createObjectURL(new Blob([data]));
            }
            else {
                for (const key in data) {
                    serialize(data[key]);
                }
            }
        }
    }
    async function deserialize(data, ports) {
        if (Array.isArray(data)) {
            await Promise.all(data.map(async (value, i) => {
                data[i] = await deserialize(value, ports);
            }));
        }
        else if (data && typeof data === "object") {
            const type = data[SYMBOL];
            if (type === "port") {
                const port = deserializePort(data.port);
                ports.push(port);
                return port;
            }
            else if (type) {
                const url = new URL(data.blob);
                if (url.protocol === "blob:") {
                    const buffer = await (await fetch(url.href)).arrayBuffer();
                    switch (type) {
                        case "uint16=":
                            return new Uint16Array(buffer);
                        case "uint8":
                            return new Uint8Array(buffer);
                        case "uint32":
                            return new Uint32Array(buffer);
                        case "buffer":
                            return buffer;
                    }
                }
            }
            await Promise.all(Object.keys(data).map(async (key) => {
                data[key] = await deserialize(data[key], ports);
            }));
        }
        return data;
    }
    return {
        postMessage: (message, transfer) => {
            serialize(message);
            port.postMessage(message);
        },
        addEventListener: (_, handler) => {
            const listener = async (data) => {
                const ports = [];
                const event = new MessageEvent("message", {
                    data: await deserialize(data, ports),
                    ports,
                });
                if ("handleEvent" in handler) {
                    handler.handleEvent(event);
                }
                else {
                    handler(event);
                }
            };
            port.onMessage.addListener(listener);
            listeners.set(handler, listener);
        },
        removeEventListener: (_, handler) => {
            const listener = listeners.get(handler);
            if (!listener) {
                return;
            }
            port.onMessage.removeListener(listener);
            listeners.delete(handler);
        },
    };
}
exports.createEndpoint = createEndpoint;
function forward(messagePort, extensionPort, resolvePort = _resolvePort, deserializePort = _deserializePort) {
    const port = createEndpoint(extensionPort, resolvePort, deserializePort);
    messagePort.onmessage = ({ data, ports }) => {
        port.postMessage(data, ports);
    };
    port.addEventListener("message", ({ data, ports }) => {
        messagePort.postMessage(data, ports);
    });
}
exports.forward = forward;
function isMessagePort(port) {
    return port.name.startsWith(SYMBOL);
}
exports.isMessagePort = isMessagePort;
//# sourceMappingURL=adapter.js.map