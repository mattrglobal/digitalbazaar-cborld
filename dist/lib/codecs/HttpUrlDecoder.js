"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpUrlDecoder = void 0;
/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
const CborldDecoder_js_1 = require("./CborldDecoder.js");
class HttpUrlDecoder extends CborldDecoder_js_1.CborldDecoder {
    constructor({ secure } = {}) {
        super();
        this.secure = secure;
    }
    decode({ value } = {}) {
        const scheme = this.secure ? 'https://' : 'http://';
        return `${scheme}${value[1]}`;
    }
    static createDecoder({ value } = {}) {
        if (!(value.length === 2 && typeof value[1] === 'string')) {
            return false;
        }
        return new HttpUrlDecoder({ secure: value[0] === 2 });
    }
}
exports.HttpUrlDecoder = HttpUrlDecoder;
//# sourceMappingURL=HttpUrlDecoder.js.map