export class VocabTermEncoder extends CborldEncoder {
    static createEncoder({ value, transformer }?: {
        value: any;
        transformer: any;
    }): false | import("./UuidUrnEncoder.js").UuidUrnEncoder | VocabTermEncoder | undefined;
    constructor({ termId }?: {
        termId: any;
    });
    termId: any;
}
import { CborldEncoder } from "./CborldEncoder.js";
//# sourceMappingURL=VocabTermEncoder.d.ts.map