"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CborldError = void 0;
/*!
 * Copyright (c) 2020 Digital Bazaar, Inc. All rights reserved.
 */
class CborldError extends Error {
    constructor(value, message) {
        super();
        this.message = message;
        this.value = value;
        this.stack = (new Error(`${value}: ${message}`)).stack;
        this.name = this.constructor.name;
    }
}
exports.CborldError = CborldError;
//# sourceMappingURL=CborldError.js.map