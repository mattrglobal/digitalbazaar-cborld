"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inspect = void 0;
// browser support
/* eslint-env browser */
/* eslint-disable-next-line no-unused-vars */
function inspect(data, options) {
    return JSON.stringify(data, null, 2);
}
exports.inspect = inspect;
//# sourceMappingURL=util-browser.js.map