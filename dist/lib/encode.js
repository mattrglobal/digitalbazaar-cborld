"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encode = void 0;
/*!
 * Copyright (c) 2020-2021 Digital Bazaar, Inc. All rights reserved.
 */
const cborg = __importStar(require("cborg"));
const util_js_1 = require("./util.js");
const Compressor_js_1 = require("./Compressor.js");
/**
 * Encodes a given JSON-LD document into a CBOR-LD byte array.
 *
 * @param {object} options - The options to use when encoding to CBOR-LD.
 * @param {object} options.jsonldDocument - The JSON-LD Document to convert to
 *   CBOR-LD bytes.
 * @param {documentLoaderFunction} options.documentLoader -The document loader
 *   to use when resolving JSON-LD Context URLs.
 * @param {boolean} [options.compressionMode=1] - `1` to use compression mode
 *   version 1, `0` to use no compression.
 * @param {Map} [options.appContextMap] - A map of JSON-LD Context URLs and
 *   their encoded CBOR-LD values (must be values greater than 32767 (0x7FFF)).
 * @param {diagnosticFunction} [options.diagnose] - A function that, if
 * provided, is called with diagnostic information.
 *
 * @returns {Promise<Uint8Array>} - The encoded CBOR-LD bytes.
 */
function encode({ jsonldDocument, documentLoader, appContextMap = new Map(), compressionMode = 1, diagnose } = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(compressionMode === 0 || compressionMode === 1)) {
            throw new TypeError('"compressionMode" must be "0" (no compression) or "1" ' +
                'for compression mode version 1.');
        }
        // 0xd9 == 11011001
        // 110 = CBOR major type 6
        // 11001 = 25, 16-bit tag size (65536 possible values)
        // 0x05 = always the first 8-bits of a CBOR-LD tag
        // compressionMode = last 8-bits of a CBOR-LD tag indicating compression type
        const prefix = new Uint8Array([0xd9, 0x05, compressionMode]);
        let suffix;
        if (compressionMode === 0) {
            // handle uncompressed CBOR-LD
            suffix = cborg.encode(jsonldDocument);
        }
        else {
            // compress CBOR-LD
            const compressor = new Compressor_js_1.Compressor({ documentLoader, appContextMap });
            suffix = yield compressor.compress({ jsonldDocument, diagnose });
        }
        // concatenate prefix and suffix
        const length = prefix.length + suffix.length;
        const bytes = new Uint8Array(length);
        bytes.set(prefix);
        bytes.set(suffix, prefix.length);
        if (diagnose) {
            diagnose('Diagnostic CBOR-LD result:');
            diagnose(util_js_1.inspect(bytes, { depth: null, colors: true }));
        }
        return bytes;
    });
}
exports.encode = encode;
/**
 * A diagnostic function that is called with diagnostic information. Typically
 * set to `console.log` when debugging.
 *
 * @callback diagnosticFunction
 * @param {string} message - The diagnostic message.
 */
/**
 * Fetches a resource given a URL and returns it as a string.
 *
 * @callback documentLoaderFunction
 * @param {string} url - The URL to retrieve.
 *
 * @returns {string} The resource associated with the URL as a string.
 */
//# sourceMappingURL=encode.js.map