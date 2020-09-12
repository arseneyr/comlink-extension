Object.defineProperty(exports, "__esModule", { value: true });
exports.createBackgroundEndpoint = void 0;
const webextension_polyfill_ts_1 = require("webextension-polyfill-ts");
const adapter_1 = require("./adapter");
const portCallbacks = new Map();
const ports = new Map();
function serializePort(id, onPort) {
    if (!portCallbacks.has(id)) {
        portCallbacks.set(id, []);
    }
    const callbacks = portCallbacks.get(id);
    callbacks.push(onPort);
}
function deserializePort(id) {
    const port = ports.get(id);
    const { port1, port2 } = new MessageChannel();
    adapter_1.forward(port2, port, serializePort, deserializePort);
    return port1;
}
webextension_polyfill_ts_1.browser.runtime.onConnect.addListener((port) => {
    var _a;
    if (!adapter_1.isMessagePort(port))
        return;
    ports.set(port.name, port);
    (_a = portCallbacks.get(port.name)) === null || _a === void 0 ? void 0 : _a.forEach((cb) => cb(port));
});
function createBackgroundEndpoint(port) {
    return adapter_1.createEndpoint(port, serializePort, deserializePort);
}
exports.createBackgroundEndpoint = createBackgroundEndpoint;
//# sourceMappingURL=backgroundEndpoint.js.map