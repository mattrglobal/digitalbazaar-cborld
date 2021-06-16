"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UuidUrnDecoder = void 0;
/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
const CborldDecoder_js_1 = require("./CborldDecoder.js");
const uuid_1 = require("uuid");
class UuidUrnDecoder extends CborldDecoder_js_1.CborldDecoder {
    decode({ value } = {}) {
        const uuid = typeof value[1] === 'string' ?
            value[1] : uuid_1.stringify(value[1]);
        return `urn:uuid:${uuid}`;
    }
    static createDecoder({ value } = {}) {
        if (value.length === 2 &&
            (typeof value[1] === 'string' || value[1] instanceof Uint8Array)) {
            return new UuidUrnDecoder();
        }
    }
}
exports.UuidUrnDecoder = UuidUrnDecoder;
//# sourceMappingURL=UuidUrnDecoder.js.map