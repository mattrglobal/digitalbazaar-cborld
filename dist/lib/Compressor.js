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
exports.Compressor = exports.TYPE_ENCODERS = void 0;
/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
const cborg = __importStar(require("cborg"));
const CborldError_js_1 = require("./CborldError.js");
const CborldEncoder_js_1 = require("./codecs/CborldEncoder.js");
const ContextEncoder_js_1 = require("./codecs/ContextEncoder.js");
const MultibaseEncoder_js_1 = require("./codecs/MultibaseEncoder.js");
const Transformer_js_1 = require("./Transformer.js");
const UriEncoder_js_1 = require("./codecs/UriEncoder.js");
const VocabTermEncoder_js_1 = require("./codecs/VocabTermEncoder.js");
const XsdDateEncoder_js_1 = require("./codecs/XsdDateEncoder.js");
const XsdDateTimeEncoder_js_1 = require("./codecs/XsdDateTimeEncoder.js");
const util_js_1 = require("./util.js");
const keywords_js_1 = require("./keywords.js");
exports.TYPE_ENCODERS = new Map([
    ['@id', UriEncoder_js_1.UriEncoder],
    ['@vocab', VocabTermEncoder_js_1.VocabTermEncoder],
    ['https://w3id.org/security#multibase', MultibaseEncoder_js_1.MultibaseEncoder],
    ['http://www.w3.org/2001/XMLSchema#date', XsdDateEncoder_js_1.XsdDateEncoder],
    ['http://www.w3.org/2001/XMLSchema#dateTime', XsdDateTimeEncoder_js_1.XsdDateTimeEncoder]
]);
const CONTEXT_TERM_ID = keywords_js_1.KEYWORDS.get('@context');
const CONTEXT_TERM_ID_PLURAL = CONTEXT_TERM_ID + 1;
// override cborg object encoder to use cborld encoders
const typeEncoders = {
    Object(obj) {
        if (obj instanceof CborldEncoder_js_1.CborldEncoder) {
            return obj.encode({ obj });
        }
    }
};
class Compressor extends Transformer_js_1.Transformer {
    /**
     * Creates a new Compressor for generating compressed CBOR-LD from a
     * JSON-LD document. The created instance may only be used on a single
     * JSON-LD document at a time.
     *
     * @param {object} options - The options to use when encoding to CBOR-LD.
     * @param {documentLoaderFunction} options.documentLoader -The document
     *   loader to use when resolving JSON-LD Context URLs.
     * @param {Map} [options.appContextMap] - A map of JSON-LD Context URLs and
     *   their encoded CBOR-LD values (must be values greater than 32767
     *   (0x7FFF)).
     */
    constructor({ documentLoader, appContextMap } = {}) {
        super({ documentLoader, appContextMap });
    }
    /**
     * Compresses the given JSON-LD document into a CBOR-LD byte array of
     * compressed bytes that should follow the compressed CBOR-LD CBOR tag.
     *
     * @param {object} options - The options to use.
     * @param {object} options.jsonldDocument - The JSON-LD Document to convert
     *   to CBOR-LD bytes.
     * @param {diagnosticFunction} [options.diagnose] - A function that, if
     *   provided, is called with diagnostic information.
     *
     * @returns {Promise<Uint8Array>} - The compressed CBOR-LD bytes.
     */
    compress({ jsonldDocument, diagnose } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const transformMaps = yield this._createTransformMaps({ jsonldDocument });
            if (diagnose) {
                diagnose('Diagnostic CBOR-LD compression transform map(s):');
                diagnose(util_js_1.inspect(transformMaps, { depth: null, colors: true }));
            }
            return cborg.encode(transformMaps, { typeEncoders });
        });
    }
    _createTransformMaps({ jsonldDocument }) {
        return __awaiter(this, void 0, void 0, function* () {
            // initialize state
            this.contextMap = new Map();
            this.termToId = new Map(keywords_js_1.KEYWORDS);
            this.nextTermId = keywords_js_1.FIRST_CUSTOM_TERM_ID;
            // handle single or multiple JSON-LD docs
            const transformMaps = [];
            const isArray = Array.isArray(jsonldDocument);
            const docs = isArray ? jsonldDocument : [jsonldDocument];
            for (const obj of docs) {
                const transformMap = new Map();
                yield this._transform({ obj, transformMap });
                transformMaps.push(transformMap);
            }
            return isArray ? transformMaps : transformMaps[0];
        });
    }
    _afterObjectContexts({ obj, transformMap }) {
        // if `@context` is present in the object, encode it
        const context = obj['@context'];
        if (!context) {
            return;
        }
        const entries = [];
        const isArray = Array.isArray(context);
        const contexts = isArray ? context : [context];
        for (const value of contexts) {
            const encoder = ContextEncoder_js_1.ContextEncoder.createEncoder({ value, transformer: this });
            entries.push(encoder || value);
        }
        const id = isArray ? CONTEXT_TERM_ID_PLURAL : CONTEXT_TERM_ID;
        transformMap.set(id, isArray ? entries : entries[0]);
    }
    _getEntries({ obj, termMap }) {
        // get term entries to be transformed and sort by *term* to ensure term
        // IDs will be assigned in the same order that the decompressor will
        const entries = [];
        const keys = Object.keys(obj).sort();
        for (const key of keys) {
            // skip `@context`; not a term entry
            if (key === '@context') {
                continue;
            }
            // check for undefined terms
            const def = termMap.get(key);
            if (def === undefined && !(key.startsWith('@') && keywords_js_1.KEYWORDS.has(key))) {
                throw new CborldError_js_1.CborldError('ERR_UNKNOWN_CBORLD_TERM', `Unknown term '${key}' was detected in the JSON-LD input.`);
            }
            const value = obj[key];
            const plural = Array.isArray(value);
            const termId = this._getIdForTerm({ term: key, plural });
            entries.push([{ term: key, termId, plural, def }, value]);
        }
        return entries;
    }
    _transformObjectId({ transformMap, termInfo, value }) {
        const { termId } = termInfo;
        const encoder = UriEncoder_js_1.UriEncoder.createEncoder({ value, transformer: this, termInfo });
        transformMap.set(termId, encoder || value);
    }
    _transformObjectType({ transformMap, termInfo, value }) {
        const { termId, plural } = termInfo;
        const values = plural ? value : [value];
        const entries = [];
        for (const value of values) {
            const encoder = VocabTermEncoder_js_1.VocabTermEncoder.createEncoder({ value, transformer: this, termInfo });
            entries.push(encoder || value);
        }
        transformMap.set(termId, plural ? entries : entries[0]);
    }
    _transformTypedValue({ entries, termType, value, termInfo }) {
        const EncoderClass = exports.TYPE_ENCODERS.get(termType);
        const encoder = EncoderClass && EncoderClass.createEncoder({ value, transformer: this, termInfo });
        if (encoder) {
            entries.push(encoder);
            return true;
        }
    }
    _transformArray({ entries, contextStack, value }) {
        return __awaiter(this, void 0, void 0, function* () {
            // recurse into array
            const children = [];
            for (const obj of value) {
                const childMap = new Map();
                children.push(childMap);
                yield this._transform({ obj, transformMap: childMap, contextStack });
            }
            entries.push(children);
        });
    }
    _transformObject({ entries, contextStack, value }) {
        return __awaiter(this, void 0, void 0, function* () {
            // recurse into object
            const transformMap = new Map();
            entries.push(transformMap);
            yield this._transform({ obj: value, transformMap, contextStack });
        });
    }
    _assignEntries({ entries, transformMap, termInfo }) {
        const { termId, plural } = termInfo;
        transformMap.set(termId, plural ? entries : entries[0]);
    }
}
exports.Compressor = Compressor;
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
//# sourceMappingURL=Compressor.js.map