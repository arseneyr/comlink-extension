import { Runtime } from "webextension-polyfill-ts";
import * as Comlink from "comlink";
export declare type OnPortCallback = (port: Runtime.Port) => void;
export declare type PortResolver = (id: string, onPort: OnPortCallback) => void;
export declare type PortDeserializer = (id: string) => MessagePort;
declare global {
    interface ProxyConstructor {
        new <TSource extends object, TTarget extends object = TSource>(target: TSource, handler: ProxyHandler<TSource>): TTarget;
    }
}
export declare function createEndpoint(port: Runtime.Port, resolvePort?: PortResolver, deserializePort?: PortDeserializer): Comlink.Endpoint;
export declare function forward(messagePort: MessagePort, extensionPort: Runtime.Port, resolvePort?: PortResolver, deserializePort?: PortDeserializer): void;
export declare function isMessagePort(port: {
    name: string;
}): boolean;
