"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultibaseEncoder = void 0;
/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
const js_base64_1 = require("js-base64");
const CborldEncoder_js_1 = require("./CborldEncoder.js");
const base58_universal_1 = require("base58-universal");
const cborg_1 = require("cborg");
// this class is used to encode a multibase encoded value in CBOR-LD, which
// actually means transforming a multibase-encoded string to bytes
class MultibaseEncoder extends CborldEncoder_js_1.CborldEncoder {
    constructor({ value } = {}) {
        super();
        this.value = value;
    }
    encode() {
        const { value } = this;
        let prefix;
        let suffix;
        if (value[0] === 'z') {
            // 0x7a === 'z' (multibase code for base58btc)
            prefix = 0x7a;
            suffix = base58_universal_1.decode(value.substr(1));
        }
        else if (value[0] === 'M') {
            // 0x4d === 'M' (multibase code for base64pad)
            prefix = 0x4d;
            suffix = js_base64_1.Base64.toUint8Array(value.substr(1));
        }
        const bytes = new Uint8Array(1 + suffix.length);
        bytes[0] = prefix;
        bytes.set(suffix, 1);
        return new cborg_1.Token(cborg_1.Type.bytes, bytes);
    }
    static createEncoder({ value } = {}) {
        if (typeof value !== 'string') {
            return false;
        }
        // supported multibase encodings:
        // 0x7a === 'z' (multibase code for base58btc)
        // 0x4d === 'M' (multibase code for base64pad)
        if (value[0] === 'z' || value[0] === 'M') {
            return new MultibaseEncoder({ value });
        }
    }
}
exports.MultibaseEncoder = MultibaseEncoder;
//# sourceMappingURL=MultibaseEncoder.js.map