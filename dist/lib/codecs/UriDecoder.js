"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UriDecoder = void 0;
/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
const CborldDecoder_js_1 = require("./CborldDecoder.js");
const Base58DidUrlDecoder_js_1 = require("./Base58DidUrlDecoder.js");
const HttpUrlDecoder_js_1 = require("./HttpUrlDecoder.js");
const UuidUrnDecoder_js_1 = require("./UuidUrnDecoder.js");
const SCHEME_ID_TO_DECODER = new Map([
    [1, HttpUrlDecoder_js_1.HttpUrlDecoder],
    [2, HttpUrlDecoder_js_1.HttpUrlDecoder],
    [3, UuidUrnDecoder_js_1.UuidUrnDecoder],
    [1024, Base58DidUrlDecoder_js_1.Base58DidUrlDecoder],
    [1025, Base58DidUrlDecoder_js_1.Base58DidUrlDecoder]
]);
class UriDecoder extends CborldDecoder_js_1.CborldDecoder {
    static createDecoder({ value } = {}) {
        if (!(Array.isArray(value) || value.length > 1)) {
            return false;
        }
        const DecoderClass = SCHEME_ID_TO_DECODER.get(value[0]);
        return DecoderClass && DecoderClass.createDecoder({ value });
    }
}
exports.UriDecoder = UriDecoder;
//# sourceMappingURL=UriDecoder.js.map