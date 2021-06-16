"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XsdDateTimeEncoder = void 0;
/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
const CborldEncoder_js_1 = require("./CborldEncoder.js");
const cborg_1 = require("cborg");
class XsdDateTimeEncoder extends CborldEncoder_js_1.CborldEncoder {
    constructor({ value, parsed } = {}) {
        super();
        this.value = value;
        this.parsed = parsed;
    }
    encode() {
        const { value, parsed } = this;
        const secondsSinceEpoch = Math.floor(parsed / 1000);
        const secondsToken = new cborg_1.Token(cborg_1.Type.uint, secondsSinceEpoch);
        const millisecondIndex = value.indexOf('.');
        if (millisecondIndex === -1) {
            const expectedDate = new Date(secondsSinceEpoch * 1000).toISOString().replace('.000Z', 'Z');
            if (value !== expectedDate) {
                // compression would be lossy, do not compress
                return new cborg_1.Token(cborg_1.Type.string, value);
            }
            // compress with second precision
            return secondsToken;
        }
        const milliseconds = parseInt(value.substr(millisecondIndex + 1), 10);
        const expectedDate = new Date(secondsSinceEpoch * 1000 + milliseconds).toISOString();
        if (value !== expectedDate) {
            // compress would be lossy, do not compress
            return new cborg_1.Token(cborg_1.Type.string, value);
        }
        // compress with subsecond precision
        const entries = [
            secondsToken,
            new cborg_1.Token(cborg_1.Type.uint, milliseconds)
        ];
        return [new cborg_1.Token(cborg_1.Type.array, entries.length), entries];
    }
    static createEncoder({ value } = {}) {
        if (!value.includes('T')) {
            // no time included, cannot compress
            return false;
        }
        const parsed = Date.parse(value);
        if (isNaN(parsed)) {
            // no date parsed, cannot compress
            return false;
        }
        return new XsdDateTimeEncoder({ value, parsed });
    }
}
exports.XsdDateTimeEncoder = XsdDateTimeEncoder;
//# sourceMappingURL=XsdDateTimeEncoder.js.map