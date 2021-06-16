"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VocabTermDecoder = void 0;
/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
const CborldDecoder_js_1 = require("./CborldDecoder.js");
const UriDecoder_js_1 = require("./UriDecoder.js");
class VocabTermDecoder extends CborldDecoder_js_1.CborldDecoder {
    constructor({ term } = {}) {
        super();
        this.term = term;
    }
    decode() {
        return this.term;
    }
    static createDecoder({ value, transformer } = {}) {
        if (Array.isArray(value)) {
            return UriDecoder_js_1.UriDecoder.createDecoder({ value, transformer });
        }
        const term = transformer.idToTerm.get(value);
        if (term !== undefined) {
            return new VocabTermDecoder({ term });
        }
    }
}
exports.VocabTermDecoder = VocabTermDecoder;
//# sourceMappingURL=VocabTermDecoder.js.map