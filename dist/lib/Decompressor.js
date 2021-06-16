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
exports.Decompressor = exports.TYPE_DECODERS = void 0;
/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
const cborg = __importStar(require("cborg"));
const CborldError_js_1 = require("./CborldError.js");
const ContextDecoder_js_1 = require("./codecs/ContextDecoder.js");
const MultibaseDecoder_js_1 = require("./codecs/MultibaseDecoder.js");
const Transformer_js_1 = require("./Transformer.js");
const UriDecoder_js_1 = require("./codecs/UriDecoder.js");
const VocabTermDecoder_js_1 = require("./codecs/VocabTermDecoder.js");
const XsdDateDecoder_js_1 = require("./codecs/XsdDateDecoder.js");
const XsdDateTimeDecoder_js_1 = require("./codecs/XsdDateTimeDecoder.js");
const util_js_1 = require("./util.js");
const keywords_js_1 = require("./keywords.js");
exports.TYPE_DECODERS = new Map([
    ['@id', UriDecoder_js_1.UriDecoder],
    ['@vocab', VocabTermDecoder_js_1.VocabTermDecoder],
    ['https://w3id.org/security#multibase', MultibaseDecoder_js_1.MultibaseDecoder],
    ['http://www.w3.org/2001/XMLSchema#date', XsdDateDecoder_js_1.XsdDateDecoder],
    ['http://www.w3.org/2001/XMLSchema#dateTime', XsdDateTimeDecoder_js_1.XsdDateTimeDecoder]
]);
const CONTEXT_TERM_ID = keywords_js_1.KEYWORDS.get('@context');
const CONTEXT_TERM_ID_PLURAL = CONTEXT_TERM_ID + 1;
class Decompressor extends Transformer_js_1.Transformer {
    /**
     * Creates a new Decompressor for generating a JSON-LD document from
     * compressed CBOR-LD. The created instance may only be used on a single
     * CBOR-LD input at a time.
     *
     * @param {object} options - The options to use when encoding to CBOR-LD.
     * @param {documentLoaderFunction} options.documentLoader - The document
     *   loader to use when resolving JSON-LD Context URLs.
     * @param {Map} [options.appContextMap] - A map of JSON-LD Context URLs and
     *   their encoded CBOR-LD values (must be values greater than 32767
     *   (0x7FFF)).
     */
    constructor({ documentLoader, appContextMap } = {}) {
        super({ documentLoader, appContextMap });
        this.reverseAppContextMap = new Map();
        // build reverse contxt map
        if (appContextMap) {
            for (const [k, v] of appContextMap) {
                this.reverseAppContextMap.set(v, k);
            }
        }
    }
    /**
     * Decompresses the given CBOR-LD byte array to a JSON-LD document.
     *
     * @param {object} options - The options to use.
     * @param {Uint8Array} options.compressedBytes - The CBOR-LD compressed
     *   bytes that follow the compressed CBOR-LD CBOR tag.
     * @param {diagnosticFunction} [options.diagnose] - A function that, if
     *   provided, is called with diagnostic information.
     *
     * @returns {Promise<object>} - The JSON-LD document.
     */
    decompress({ compressedBytes, diagnose } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            this.contextMap = new Map();
            this.termToId = new Map(keywords_js_1.KEYWORDS);
            this.nextTermId = keywords_js_1.FIRST_CUSTOM_TERM_ID;
            this.idToTerm = new Map();
            for (const [term, id] of this.termToId) {
                this.idToTerm.set(id, term);
            }
            // decoded output could be one or more transform maps
            const transformMap = cborg.decode(compressedBytes, { useMaps: true });
            if (diagnose) {
                diagnose('Diagnostic CBOR-LD decompression transform map(s):');
                diagnose(util_js_1.inspect(transformMap, { depth: null, colors: true }));
            }
            // handle single or multiple JSON-LD docs
            const results = [];
            const isArray = Array.isArray(transformMap);
            const transformMaps = isArray ? transformMap : [transformMap];
            for (const transformMap of transformMaps) {
                const obj = {};
                yield this._transform({ obj, transformMap });
                results.push(obj);
            }
            return isArray ? results : results[0];
        });
    }
    _beforeObjectContexts({ obj, transformMap }) {
        // decode `@context` for `transformMap`, if any
        const encodedContext = transformMap.get(CONTEXT_TERM_ID);
        if (encodedContext) {
            const decoder = ContextDecoder_js_1.ContextDecoder.createDecoder({ value: encodedContext, transformer: this });
            obj['@context'] = decoder ?
                decoder.decode({ value: encodedContext }) : encodedContext;
        }
        const encodedContexts = transformMap.get(CONTEXT_TERM_ID_PLURAL);
        if (encodedContexts) {
            if (encodedContext) {
                // can't use *both* the singular and plural context term ID
                throw new CborldError_js_1.CborldError('ERR_INVALID_ENCODED_CONTEXT', 'Both singular and plural context IDs were found in the ' +
                    'CBOR-LD input.');
            }
            if (!Array.isArray(encodedContexts)) {
                // `encodedContexts` must be an array
                throw new CborldError_js_1.CborldError('ERR_INVALID_ENCODED_CONTEXT', 'Encoded plural context value must be an array.');
            }
            const entries = [];
            for (const value of encodedContexts) {
                const decoder = ContextDecoder_js_1.ContextDecoder.createDecoder({ value, transformer: this });
                entries.push(decoder ? decoder.decode({ value }) : value);
            }
            obj['@context'] = entries;
        }
    }
    _beforeTypeScopedContexts({ activeCtx, obj, transformMap }) {
        // decode object types
        const { termToId } = this;
        const typeTerms = ['@type', ...activeCtx.aliases.type];
        for (const term of typeTerms) {
            // check both singular and plural term IDs
            const termId = termToId.get(term);
            let value = transformMap.get(termId);
            if (value === undefined) {
                value = transformMap.get(termId + 1);
            }
            if (value !== undefined) {
                if (Array.isArray(value)) {
                    obj[term] = value.map(value => {
                        const decoder = VocabTermDecoder_js_1.VocabTermDecoder.createDecoder({ value, transformer: this });
                        return decoder ? decoder.decode({ value }) : value;
                    });
                }
                else {
                    const decoder = VocabTermDecoder_js_1.VocabTermDecoder.createDecoder({ value, transformer: this });
                    obj[term] = decoder ? decoder.decode({ value }) : value;
                }
            }
        }
    }
    _getEntries({ transformMap, termMap }) {
        // get term entries to be transformed and sort by *term* to ensure term
        // IDs will be assigned in the same order that the compressor assigned them
        const entries = [];
        for (const [key, value] of transformMap) {
            // skip `@context`; not a term entry
            if (key === CONTEXT_TERM_ID || key === CONTEXT_TERM_ID_PLURAL) {
                continue;
            }
            // check for undefined term IDs
            const { term, plural } = this._getTermForId({ id: key });
            if (term === undefined) {
                throw new CborldError_js_1.CborldError('ERR_UNKNOWN_CBORLD_TERM_ID', `Unknown term ID '${key}' was detected in the CBOR-LD input.`);
            }
            // check for undefined term
            const def = termMap.get(term);
            if (def === undefined && !(term.startsWith('@') && keywords_js_1.KEYWORDS.has(term))) {
                throw new CborldError_js_1.CborldError('ERR_UNKNOWN_CBORLD_TERM', `Unknown term "${term}" was detected in the CBOR-LD input.`);
            }
            entries.push([{ term, termId: key, plural, def }, value]);
        }
        return entries.sort(_sortEntriesByTerm);
    }
    _getTermInfo({ termMap, key }) {
        // check for undefined term IDs
        const { term, plural } = this._getTermForId({ id: key });
        if (term === undefined) {
            throw new CborldError_js_1.CborldError('ERR_UNKNOWN_CBORLD_TERM_ID', `Unknown term ID '${key}' was detected in the CBOR-LD input.`);
        }
        // check for undefined term
        const def = termMap.get(term);
        if (def === undefined && !(term.startsWith('@') && keywords_js_1.KEYWORDS.has(term))) {
            throw new CborldError_js_1.CborldError('ERR_UNKNOWN_CBORLD_TERM', `Unknown term "${term}" was detected in the CBOR-LD input.`);
        }
        return { term, termId: key, plural, def };
    }
    _transformObjectId({ obj, termInfo, value }) {
        const decoder = UriDecoder_js_1.UriDecoder.createDecoder({ value });
        obj[termInfo.term] = decoder ? decoder.decode({ value }) : value;
    }
    _transformObjectType({ obj, termInfo, value }) {
        const { term, plural } = termInfo;
        const values = plural ? value : [value];
        const entries = [];
        for (const value of values) {
            const decoder = VocabTermDecoder_js_1.VocabTermDecoder.createDecoder({ value, transformer: this });
            entries.push(decoder ? decoder.decode({ value }) : value);
        }
        obj[term] = plural ? entries : entries[0];
    }
    _transformTypedValue({ entries, termType, value }) {
        const DecoderClass = exports.TYPE_DECODERS.get(termType);
        const decoder = DecoderClass && DecoderClass.createDecoder({ value, transformer: this });
        if (decoder) {
            entries.push(decoder.decode({ value }));
            return true;
        }
    }
    _transformArray({ entries, contextStack, value }) {
        return __awaiter(this, void 0, void 0, function* () {
            // recurse into array
            const children = [];
            for (const transformMap of value) {
                const obj = {};
                children.push(obj);
                yield this._transform({ obj, transformMap, contextStack });
            }
            entries.push(children);
        });
    }
    _transformObject({ entries, contextStack, value }) {
        return __awaiter(this, void 0, void 0, function* () {
            // recurse into object
            const child = {};
            entries.push(child);
            return this._transform({ obj: child, transformMap: value, contextStack });
        });
    }
    _assignEntries({ entries, obj, termInfo }) {
        const { term, plural } = termInfo;
        obj[term] = plural ? entries : entries[0];
    }
}
exports.Decompressor = Decompressor;
function _sortEntriesByTerm([{ term: t1 }], [{ term: t2 }]) {
    return t1 < t2 ? -1 : t1 > t2 ? 1 : 0;
}
/**
 * Fetches a resource given a URL and returns it as a string.
 *
 * @callback documentLoaderFunction
 * @param {string} url - The URL to retrieve.
 *
 * @returns {string} The resource associated with the URL as a string.
 */
/**
 * A diagnostic function that is called with diagnostic information. Typically
 * set to `console.log` when debugging.
 *
 * @callback diagnosticFunction
 * @param {string} message - The diagnostic message.
 */
//# sourceMappingURL=Decompressor.js.map