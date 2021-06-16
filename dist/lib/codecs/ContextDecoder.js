"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextDecoder = void 0;
/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
const CborldDecoder_js_1 = require("./CborldDecoder.js");
const CborldError_js_1 = require("../CborldError.js");
const registeredContexts_js_1 = require("./registeredContexts.js");
class ContextDecoder extends CborldDecoder_js_1.CborldDecoder {
    constructor({ reverseAppContextMap } = {}) {
        super();
        this.reverseAppContextMap = reverseAppContextMap;
    }
    decode({ value } = {}) {
        // handle uncompressed context
        if (typeof value !== 'number') {
            return _mapToObject(value);
        }
        // handle compressed context
        const url = registeredContexts_js_1.ID_TO_URL.get(value) || this.reverseAppContextMap.get(value);
        if (url === undefined) {
            throw new CborldError_js_1.CborldError('ERR_UNDEFINED_COMPRESSED_CONTEXT', `Undefined compressed context "${value}".`);
        }
        return url;
    }
    static createDecoder({ transformer } = {}) {
        const { reverseAppContextMap } = transformer;
        return new ContextDecoder({ reverseAppContextMap });
    }
}
exports.ContextDecoder = ContextDecoder;
function _mapToObject(map) {
    if (Array.isArray(map)) {
        return map.map(_mapToObject);
    }
    if (!(map instanceof Map)) {
        return map;
    }
    const obj = {};
    for (const [key, value] of map) {
        obj[key] = _mapToObject(value);
    }
    return obj;
}
//# sourceMappingURL=ContextDecoder.js.map