"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Base58DidUrlDecoder = void 0;
/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
const CborldDecoder_js_1 = require("./CborldDecoder.js");
const base58_universal_1 = require("base58-universal");
const ID_TO_SCHEME = new Map([
    // Note: only v1 mainnet is supported
    [1024, 'did:v1:nym:'],
    [1025, 'did:key:']
]);
class Base58DidUrlDecoder extends CborldDecoder_js_1.CborldDecoder {
    decode({ value } = {}) {
        let url = ID_TO_SCHEME.get(value[0]);
        if (typeof value[1] === 'string') {
            url += value[1];
        }
        else {
            url += `z${base58_universal_1.encode(value[1])}`;
        }
        if (value.length > 2) {
            if (typeof value[2] === 'string') {
                url += `#${value[2]}`;
            }
            else {
                url += `#z${base58_universal_1.encode(value[2])}`;
            }
        }
        return url;
    }
    static createDecoder({ value } = {}) {
        if (!(Array.isArray(value) && value.length > 1 && value.length <= 3)) {
            return false;
        }
        if (!ID_TO_SCHEME.has(value[0])) {
            return false;
        }
        return new Base58DidUrlDecoder();
    }
}
exports.Base58DidUrlDecoder = Base58DidUrlDecoder;
//# sourceMappingURL=Base58DidUrlDecoder.js.map