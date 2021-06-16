"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UuidUrnEncoder = void 0;
/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
const CborldEncoder_js_1 = require("./CborldEncoder.js");
const cborg_1 = require("cborg");
const uuid_1 = require("uuid");
class UuidUrnEncoder extends CborldEncoder_js_1.CborldEncoder {
    constructor({ value } = {}) {
        super();
        this.value = value;
    }
    encode() {
        const { value } = this;
        const rest = value.substr('urn:uuid:'.length);
        const entries = [new cborg_1.Token(cborg_1.Type.uint, 3)];
        if (rest.toLowerCase() === rest) {
            const uuidBytes = uuid_1.parse(rest);
            entries.push(new cborg_1.Token(cborg_1.Type.bytes, uuidBytes));
        }
        else {
            // cannot compress
            entries.push(new cborg_1.Token(cborg_1.Type.string, rest));
        }
        return [new cborg_1.Token(cborg_1.Type.array, entries.length), entries];
    }
    static createEncoder({ value } = {}) {
        if (value.startsWith('urn:uuid:')) {
            return new UuidUrnEncoder({ value });
        }
    }
}
exports.UuidUrnEncoder = UuidUrnEncoder;
//# sourceMappingURL=UuidUrnEncoder.js.map