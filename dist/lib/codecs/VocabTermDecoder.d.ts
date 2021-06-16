export class VocabTermDecoder extends CborldDecoder {
    static createDecoder({ value, transformer }?: {
        value: any;
        transformer: any;
    }): false | import("./Base58DidUrlDecoder.js").Base58DidUrlDecoder | VocabTermDecoder | undefined;
    constructor({ term }?: {
        term: any;
    });
    term: any;
}
import { CborldDecoder } from "./CborldDecoder.js";
//# sourceMappingURL=VocabTermDecoder.d.ts.map