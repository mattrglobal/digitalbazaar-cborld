"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UriEncoder = void 0;
/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
const CborldEncoder_js_1 = require("./CborldEncoder.js");
const Base58DidUrlEncoder_js_1 = require("./Base58DidUrlEncoder.js");
const HttpUrlEncoder_js_1 = require("./HttpUrlEncoder.js");
const UuidUrnEncoder_js_1 = require("./UuidUrnEncoder.js");
const SCHEME_TO_ENCODER = new Map([
    ['http', HttpUrlEncoder_js_1.HttpUrlEncoder],
    ['https', HttpUrlEncoder_js_1.HttpUrlEncoder],
    ['urn:uuid', UuidUrnEncoder_js_1.UuidUrnEncoder],
    ['did:v1:nym', Base58DidUrlEncoder_js_1.Base58DidUrlEncoder],
    ['did:key', Base58DidUrlEncoder_js_1.Base58DidUrlEncoder]
]);
class UriEncoder extends CborldEncoder_js_1.CborldEncoder {
    static createEncoder({ value } = {}) {
        if (typeof value !== 'string') {
            return false;
        }
        // get full colon-delimited prefix
        let scheme;
        try {
            // this handles URIs both with authority followed by `//` and without
            const { protocol, pathname } = new URL(value);
            scheme = protocol;
            if (pathname.includes(':')) {
                scheme += pathname;
            }
            const split = value.split(':');
            split.pop();
            scheme = split.join(':');
        }
        catch (e) {
            return false;
        }
        const EncoderClass = SCHEME_TO_ENCODER.get(scheme);
        return EncoderClass && EncoderClass.createEncoder({ value });
    }
}
exports.UriEncoder = UriEncoder;
//# sourceMappingURL=UriEncoder.js.map