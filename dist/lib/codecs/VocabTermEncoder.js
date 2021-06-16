"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VocabTermEncoder = void 0;
/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
const CborldEncoder_js_1 = require("./CborldEncoder.js");
const cborg_1 = require("cborg");
const UriEncoder_js_1 = require("./UriEncoder.js");
class VocabTermEncoder extends CborldEncoder_js_1.CborldEncoder {
    constructor({ termId } = {}) {
        super();
        this.termId = termId;
    }
    encode() {
        return new cborg_1.Token(cborg_1.Type.uint, this.termId);
    }
    static createEncoder({ value, transformer } = {}) {
        const { termToId } = transformer;
        const termId = termToId.get(value);
        if (termId !== undefined) {
            return new VocabTermEncoder({ termId });
        }
        return UriEncoder_js_1.UriEncoder.createEncoder({ value });
    }
}
exports.VocabTermEncoder = VocabTermEncoder;
//# sourceMappingURL=VocabTermEncoder.js.map