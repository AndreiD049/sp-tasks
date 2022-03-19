import { WebPartContext } from "@microsoft/sp-webpart-base";
import { Queryable } from "@pnp/queryable";

export default function RPMController(treshold: number, context: WebPartContext) {
    const MINUTE = 1000 * 60;
    let count = 0;
    let firstCall = Date.now();
    let trace = {};
    const key = context.manifest.id + context.manifest.version;
    let blocked = JSON.parse(localStorage.getItem(key));
    return (instance: Queryable ) => {

        instance.on.post(async (url, result) => {
            if (blocked) {
                alert(`Application ${context.manifest.alias} was blocked because it exceeded maximum amount of requests. Please contact support.`)
                throw Error(`Application blocked`);
            }
            const current = Date.now();
            if (current - firstCall > MINUTE) {
                console.log(`Minute passed:\napi calls: ${count}\n${JSON.stringify(trace, null, 4)}`);
                count = 0;
                firstCall = current;
                trace = {};
            } else {
                count += 1;
                trace[url.pathname] = (trace[url.pathname] || 0) + 1;
            }
            if (count > treshold) {
                localStorage.setItem(key, 'true');
                localStorage.setItem(`Trace:${key}`, JSON.stringify(trace, null, 4));
                blocked = true;
                throw Error(`Too many requests! Application blocked`);
            }
            return [url, result];
        });
        return instance;
    }
}