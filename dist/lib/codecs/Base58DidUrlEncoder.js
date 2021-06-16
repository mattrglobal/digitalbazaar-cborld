"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Base58DidUrlEncoder = void 0;
/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
const CborldEncoder_js_1 = require("./CborldEncoder.js");
const cborg_1 = require("cborg");
const base58_universal_1 = require("base58-universal");
const SCHEME_TO_ID = new Map([
    ['did:v1:nym:', 1024],
    ['did:key:', 1025]
]);
class Base58DidUrlEncoder extends CborldEncoder_js_1.CborldEncoder {
    constructor({ value, scheme } = {}) {
        super();
        this.value = value;
        this.scheme = scheme;
    }
    encode() {
        const { value, scheme } = this;
        const suffix = value.substr(scheme.length);
        const [authority, fragment] = suffix.split('#');
        const entries = [
            new cborg_1.Token(cborg_1.Type.uint, SCHEME_TO_ID.get(scheme)),
            _multibase58ToToken(authority)
        ];
        if (fragment !== undefined) {
            entries.push(_multibase58ToToken(fragment));
        }
        return [new cborg_1.Token(cborg_1.Type.array, entries.length), entries];
    }
    static createEncoder({ value } = {}) {
        const keys = [...SCHEME_TO_ID.keys()];
        for (const key of keys) {
            if (value.startsWith(key)) {
                return new Base58DidUrlEncoder({ value, scheme: key });
            }
        }
    }
}
exports.Base58DidUrlEncoder = Base58DidUrlEncoder;
function _multibase58ToToken(str) {
    if (str.startsWith('z')) {
        const decoded = base58_universal_1.decode(str.substr(1));
        if (decoded) {
            return new cborg_1.Token(cborg_1.Type.bytes, decoded);
        }
    }
    // cannot compress
    return new cborg_1.Token(cborg_1.Type.string, str);
}
//# sourceMappingURL=Base58DidUrlEncoder.js.map