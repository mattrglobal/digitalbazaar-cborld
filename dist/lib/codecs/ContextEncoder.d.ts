export class ContextEncoder extends CborldEncoder {
    static createEncoder({ value, transformer }?: {
        value: any;
        transformer: any;
    }): false | ContextEncoder;
    constructor({ context, appContextMap }?: {
        context: any;
        appContextMap: any;
    });
    context: any;
    appContextMap: any;
}
import { CborldEncoder } from "./CborldEncoder.js";
//# sourceMappingURL=ContextEncoder.d.ts.map