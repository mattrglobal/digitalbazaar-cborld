"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XsdDateDecoder = void 0;
/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
const CborldDecoder_js_1 = require("./CborldDecoder.js");
class XsdDateDecoder extends CborldDecoder_js_1.CborldDecoder {
    decode({ value } = {}) {
        const dateString = new Date(value * 1000).toISOString();
        return dateString.substring(0, dateString.indexOf('T'));
    }
    static createDecoder({ value } = {}) {
        if (typeof value === 'number') {
            return new XsdDateDecoder();
        }
    }
}
exports.XsdDateDecoder = XsdDateDecoder;
//# sourceMappingURL=XsdDateDecoder.js.map