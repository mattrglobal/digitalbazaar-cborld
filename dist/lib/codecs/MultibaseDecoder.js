"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultibaseDecoder = void 0;
/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
const CborldDecoder_js_1 = require("./CborldDecoder.js");
const js_base64_1 = require("js-base64");
const base58_universal_1 = require("base58-universal");
// this class is used to encode a multibase encoded value in CBOR-LD, which
// actually means transforming bytes to a multibase-encoded string
class MultibaseDecoder extends CborldDecoder_js_1.CborldDecoder {
    decode({ value } = {}) {
        const { buffer, byteOffset, length } = value;
        const suffix = new Uint8Array(buffer, byteOffset + 1, length - 1);
        if (value[0] === 0x7a) {
            // 0x7a === 'z' (multibase code for base58btc)
            return `z${base58_universal_1.encode(suffix)}`;
        }
        if (value[0] === 0x4d) {
            // 0x4d === 'M' (multibase code for base64pad)
            return `M${js_base64_1.Base64.fromUint8Array(suffix)}`;
        }
        return value;
    }
    static createDecoder({ value } = {}) {
        if (!(value instanceof Uint8Array)) {
            return false;
        }
        // supported multibase encodings:
        // 0x7a === 'z' (multibase code for base58btc)
        // 0x4d === 'M' (multibase code for base64pad)
        if (value[0] === 0x7a || value[0] === 0x4d) {
            return new MultibaseDecoder();
        }
    }
}
exports.MultibaseDecoder = MultibaseDecoder;
//# sourceMappingURL=MultibaseDecoder.js.map