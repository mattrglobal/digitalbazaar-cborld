"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XsdDateTimeDecoder = void 0;
/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
const CborldDecoder_js_1 = require("./CborldDecoder.js");
class XsdDateTimeDecoder extends CborldDecoder_js_1.CborldDecoder {
    constructor({ value } = {}) {
        super();
        this.value = value;
    }
    decode({ value } = {}) {
        if (typeof value === 'number') {
            return new Date(value * 1000).toISOString().replace('.000Z', 'Z');
        }
        return new Date(value[0] * 1000 + value[1]).toISOString();
    }
    static createDecoder({ value } = {}) {
        if (typeof value === 'number') {
            return new XsdDateTimeDecoder();
        }
        if (Array.isArray(value) && value.length === 2 &&
            (typeof value[0] === 'number' || typeof value[1] === 'number')) {
            return new XsdDateTimeDecoder();
        }
    }
}
exports.XsdDateTimeDecoder = XsdDateTimeDecoder;
//# sourceMappingURL=XsdDateTimeDecoder.js.map