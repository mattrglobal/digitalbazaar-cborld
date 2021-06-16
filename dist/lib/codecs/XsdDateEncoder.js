"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XsdDateEncoder = void 0;
/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
const CborldEncoder_js_1 = require("./CborldEncoder.js");
const cborg_1 = require("cborg");
class XsdDateEncoder extends CborldEncoder_js_1.CborldEncoder {
    constructor({ value, parsed } = {}) {
        super();
        this.value = value;
        this.parsed = parsed;
    }
    encode() {
        const { value, parsed } = this;
        const secondsSinceEpoch = Math.floor(parsed / 1000);
        const dateString = new Date(secondsSinceEpoch * 1000).toISOString();
        const expectedDate = dateString.substring(0, dateString.indexOf('T'));
        if (value !== expectedDate) {
            // compression would be lossy, do not compress
            return new cborg_1.Token(cborg_1.Type.string, value);
        }
        return new cborg_1.Token(cborg_1.Type.uint, secondsSinceEpoch);
    }
    static createEncoder({ value } = {}) {
        if (value.includes('T')) {
            // time included, cannot compress
            return false;
        }
        const parsed = Date.parse(value);
        if (isNaN(parsed)) {
            // no date parsed, cannot compress
            return false;
        }
        return new XsdDateEncoder({ value, parsed });
    }
}
exports.XsdDateEncoder = XsdDateEncoder;
//# sourceMappingURL=XsdDateEncoder.js.map