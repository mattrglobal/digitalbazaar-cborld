"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CborldEncoder = void 0;
/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
class CborldEncoder {
    encode() {
        throw new Error('Must be implemented by derived class.');
    }
    // eslint-disable-next-line no-unused-vars
    static createEncoder({ value } = {}) {
        throw new Error('Must be implemented by derived class.');
    }
}
exports.CborldEncoder = CborldEncoder;
//# sourceMappingURL=CborldEncoder.js.map