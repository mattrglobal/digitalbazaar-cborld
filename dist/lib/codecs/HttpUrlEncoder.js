"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpUrlEncoder = void 0;
/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
const CborldEncoder_js_1 = require("./CborldEncoder.js");
const cborg_1 = require("cborg");
class HttpUrlEncoder extends CborldEncoder_js_1.CborldEncoder {
    constructor({ value, secure } = {}) {
        super();
        this.value = value;
        this.secure = secure;
    }
    encode() {
        const { value, secure } = this;
        const length = secure ? 'https://'.length : 'http://'.length;
        const entries = [
            new cborg_1.Token(cborg_1.Type.uint, secure ? 2 : 1),
            new cborg_1.Token(cborg_1.Type.string, value.substr(length))
        ];
        return [new cborg_1.Token(cborg_1.Type.array, entries.length), entries];
    }
    static createEncoder({ value } = {}) {
        // presume HTTPS is more common, check for it first
        if (value.startsWith('https://')) {
            return new HttpUrlEncoder({ value, secure: true });
        }
        if (value.startsWith('http://')) {
            return new HttpUrlEncoder({ value, secure: false });
        }
    }
}
exports.HttpUrlEncoder = HttpUrlEncoder;
//# sourceMappingURL=HttpUrlEncoder.js.map