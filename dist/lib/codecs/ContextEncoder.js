"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextEncoder = void 0;
/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
const CborldEncoder_js_1 = require("./CborldEncoder.js");
const registeredContexts_js_1 = require("./registeredContexts.js");
const cborg_1 = require("cborg");
class ContextEncoder extends CborldEncoder_js_1.CborldEncoder {
    constructor({ context, appContextMap } = {}) {
        super();
        this.context = context;
        this.appContextMap = appContextMap;
    }
    encode() {
        const { context } = this;
        const id = registeredContexts_js_1.URL_TO_ID.get(context) || this.appContextMap.get(context);
        if (id === undefined) {
            return new cborg_1.Token(cborg_1.Type.string, context);
        }
        return new cborg_1.Token(cborg_1.Type.uint, id);
    }
    static createEncoder({ value, transformer } = {}) {
        if (typeof value !== 'string') {
            return false;
        }
        const { appContextMap } = transformer;
        return new ContextEncoder({ context: value, appContextMap });
    }
}
exports.ContextEncoder = ContextEncoder;
//# sourceMappingURL=ContextEncoder.js.map