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
exports.decode = void 0;
/*!
 * Copyright (c) 2020-2021 Digital Bazaar, Inc. All rights reserved.
 */
const cborg = __importStar(require("cborg"));
const CborldError_js_1 = require("./CborldError.js");
const Decompressor_js_1 = require("./Decompressor.js");
const util_js_1 = require("./util.js");
/**
 * Decodes a CBOR-LD byte array into a JSON-LD document.
 *
 * @param {object} options - The options to use when decoding CBOR-LD.
 * @param {Uint8Array} options.cborldBytes - The encoded CBOR-LD bytes to
 *   decode.
 * @param {Function} options.documentLoader -The document loader to use when
 *   resolving JSON-LD Context URLs.
 * @param {Map} [options.appContextMap] - A map of JSON-LD Context URLs and
 *   their associated CBOR-LD values. The values must be greater than
 *   32767 (0x7FFF)).
 * @param {diagnosticFunction} [options.diagnose] - A function that, if
 *   provided, is called with diagnostic information.
 *
 * @returns {Promise<object>} - The decoded JSON-LD Document.
 */
function decode({ cborldBytes, documentLoader, appContextMap = new Map(), diagnose }) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(cborldBytes instanceof Uint8Array)) {
            throw new TypeError('"cborldBytes" must be a Uint8Array.');
        }
        // 0xd9 == 11011001
        // 110 = CBOR major type 6
        // 11001 = 25, 16-bit tag size (65536 possible values)
        let index = 0;
        if (cborldBytes[index++] !== 0xd9) {
            throw new CborldError_js_1.CborldError('ERR_NOT_CBORLD', 'CBOR-LD must start with a CBOR major type "Tag" header of `0xd9`.');
        }
        // ensure `cborldBytes` represent CBOR-LD
        if (cborldBytes[index++] !== 0x05) {
            throw new CborldError_js_1.CborldError('ERR_NOT_CBORLD', 'CBOR-LD 16-bit tag must start with `0x05`.');
        }
        const compressionMode = cborldBytes[index];
        if (compressionMode === undefined) {
            throw new CborldError_js_1.CborldError('ERR_NOT_CBORLD', 'Truncated CBOR-LD 16-bit tag.');
        }
        if (!(compressionMode === 0 || compressionMode === 1)) {
            throw new CborldError_js_1.CborldError('ERR_NOT_CBORLD', `Unsupported CBOR-LD compression mode "${compressionMode}".`);
        }
        index++;
        const { buffer, byteOffset, length } = cborldBytes;
        const suffix = new Uint8Array(buffer, byteOffset + index, length - index);
        // handle uncompressed CBOR-LD
        if (compressionMode === 0) {
            return cborg.decode(suffix, { useMaps: false });
        }
        // decompress CBOR-LD
        const decompressor = new Decompressor_js_1.Decompressor({ documentLoader, appContextMap });
        const result = yield decompressor.decompress({ compressedBytes: suffix, diagnose });
        if (diagnose) {
            diagnose('Diagnostic JSON-LD result:');
            diagnose(util_js_1.inspect(result, { depth: null, colors: true }));
        }
        return result;
    });
}
exports.decode = decode;
/**
 * A diagnostic function that is called with diagnostic information. Typically
 * set to `console.log` when debugging.
 *
 * @callback diagnosticFunction
 * @param {string} message - The diagnostic message.
 */
//# sourceMappingURL=decode.js.map