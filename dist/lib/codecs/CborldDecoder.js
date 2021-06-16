"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CborldDecoder = void 0;
/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
class CborldDecoder {
    // eslint-disable-next-line no-unused-vars
    decode({ value } = {}) {
        throw new Error('Must be implemented by derived class.');
    }
    // eslint-disable-next-line no-unused-vars
    static createDecoder({ value, transformer } = {}) {
        throw new Error('Must be implemented by derived class.');
    }
}
exports.CborldDecoder = CborldDecoder;
//# sourceMappingURL=CborldDecoder.js.map