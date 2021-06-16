"use strict";
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
exports.Transformer = void 0;
/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
const CborldError_js_1 = require("./CborldError.js");
const keywords_js_1 = require("./keywords.js");
class Transformer {
    /**
     * Creates a new Transformer for transforming CBOR-LD <=> JSON-LD.
     *
     * @param {object} options - The options to use when encoding to CBOR-LD.
     * @param {documentLoaderFunction} options.documentLoader -The document
     *   loader to use when resolving JSON-LD Context URLs.
     * @param {Map} [options.appContextMap] - A map of JSON-LD Context URLs and
     *   their encoded CBOR-LD values (must be values greater than 32767
     *   (0x7FFF)).
     */
    constructor({ appContextMap, documentLoader } = {}) {
        this.appContextMap = appContextMap;
        this.documentLoader = documentLoader;
    }
    // default no-op hook functions
    _beforeObjectContexts() { }
    _afterObjectContexts() { }
    _beforeTypeScopedContexts() { }
    _transform({ obj, transformMap, contextStack = [] }) {
        return __awaiter(this, void 0, void 0, function* () {
            // hook before object contexts are applied
            this._beforeObjectContexts({ obj, transformMap });
            // apply embedded contexts in the object
            let activeCtx = yield this._applyEmbeddedContexts({ obj, contextStack });
            // hook after object contexts are applied
            this._afterObjectContexts({ obj, transformMap });
            // TODO: support `@propagate: true` on type-scoped contexts; until then
            // throw an error if it is set
            // preserve context stack before applying type-scoped contexts
            const childContextStack = contextStack.slice();
            // hook before type-scoped contexts are applied
            this._beforeTypeScopedContexts({ activeCtx, obj, transformMap });
            // apply type-scoped contexts
            activeCtx = yield this._applyTypeScopedContexts({ obj, contextStack });
            // walk term entries to transform
            const { aliases, scopedContextMap, termMap } = activeCtx;
            const termEntries = this._getEntries({ obj, transformMap, transformer: this, termMap });
            for (const [termInfo, value] of termEntries) {
                const { term } = termInfo;
                // transform `@id`
                if (term === '@id' || aliases.id.has(term)) {
                    this._transformObjectId({ obj, transformMap, termInfo, value });
                    continue;
                }
                // transform `@type`
                if (term === '@type' || aliases.type.has(term)) {
                    this._transformObjectType({ obj, transformMap, termInfo, value });
                    continue;
                }
                // use `childContextStack` when processing properties as it will remove
                // type-scoped contexts unless a property-scoped context is applied
                let propertyContextStack = childContextStack;
                // apply any property-scoped context
                let newActiveCtx;
                const propertyScopedContext = scopedContextMap.get(term);
                if (propertyScopedContext) {
                    // TODO: support `@propagate: false` on property-scoped contexts; until
                    // then throw an error if it is set
                    newActiveCtx = yield this._applyEmbeddedContexts({
                        obj: { '@context': propertyScopedContext },
                        contextStack
                    });
                    propertyContextStack = contextStack.slice();
                }
                // iterate through all values for the current transform entry
                const { plural, def } = termInfo;
                const termType = this._getTermType({ activeCtx: newActiveCtx || activeCtx, def });
                const values = plural ? value : [value];
                const entries = [];
                for (const value of values) {
                    // `null` is never transformed
                    if (value === null) {
                        entries.push(null);
                        continue;
                    }
                    // try to transform typed value
                    if (this._transformTypedValue({ entries, termType, value, termInfo })) {
                        continue;
                    }
                    if (typeof value !== 'object') {
                        // value not transformed and cannot recurse, so do not transform
                        entries.push(value);
                        continue;
                    }
                    // transform array
                    if (Array.isArray(value)) {
                        yield this._transformArray({ entries, contextStack: propertyContextStack, value });
                        continue;
                    }
                    // transform object
                    yield this._transformObject({
                        entries, contextStack: propertyContextStack, value
                    });
                }
                // revert property-scoped active context if one was created
                if (newActiveCtx) {
                    newActiveCtx.revert();
                }
                this._assignEntries({ entries, obj, transformMap, termInfo });
            }
            // revert active context for this object
            activeCtx.revert();
        });
    }
    /**
     * Apply the embedded contexts in the given object to produce an
     * active context.
     *
     * @param {object} options - The options to use.
     * @param {object} options.obj - The object to get the active context for.
     * @param {Array} [options.contextStack] - The stack of active contexts.
     *
     * @returns {Promise<object>} - The active context instance.
     */
    _applyEmbeddedContexts({ obj, contextStack }) {
        return __awaiter(this, void 0, void 0, function* () {
            const stackTop = contextStack.length;
            // push any local embedded contexts onto the context stack
            const localContexts = obj['@context'];
            yield this._updateContextStack({ contextStack, contexts: localContexts });
            // get `id` and `type` aliases for the active context
            let active = contextStack[contextStack.length - 1];
            if (!active) {
                // empty initial context
                active = {
                    aliases: {
                        id: new Set(),
                        type: new Set()
                    },
                    context: {},
                    scopedContextMap: new Map(),
                    termMap: new Map()
                };
            }
            return Object.assign(Object.assign({}, active), { revert() {
                    contextStack.length = stackTop;
                } });
        });
    }
    _applyTypeScopedContexts({ obj, contextStack }) {
        return __awaiter(this, void 0, void 0, function* () {
            const stackTop = contextStack.length;
            // get `id` and `type` aliases for the active context
            let active = contextStack[contextStack.length - 1];
            if (!active) {
                // empty initial context
                active = {
                    aliases: {
                        id: new Set(),
                        type: new Set()
                    },
                    context: {},
                    scopedContextMap: new Map(),
                    termMap: new Map()
                };
            }
            const { aliases } = active;
            // get unique object type(s)
            let totalTypes = [];
            const typeTerms = ['@type', ...aliases.type];
            for (const term of typeTerms) {
                const types = obj[term];
                if (Array.isArray(types)) {
                    totalTypes.push(...types);
                }
                else {
                    totalTypes.push(types);
                }
            }
            // apply types in lexicographically sorted order (per JSON-LD spec)
            totalTypes = [...new Set(totalTypes)].sort();
            // apply any type-scoped contexts
            let { scopedContextMap } = active;
            for (const type of totalTypes) {
                const contexts = scopedContextMap.get(type);
                if (contexts) {
                    yield this._updateContextStack({ contextStack, contexts });
                    active = contextStack[contextStack.length - 1];
                    ({ scopedContextMap } = active);
                }
            }
            return Object.assign(Object.assign({}, active), { revert() {
                    contextStack.length = stackTop;
                } });
        });
    }
    _updateContextStack({ contextStack, contexts, transformer }) {
        return __awaiter(this, void 0, void 0, function* () {
            // push any localized contexts onto the context stack
            if (!contexts) {
                return;
            }
            if (!Array.isArray(contexts)) {
                contexts = [contexts];
            }
            const { contextMap } = this;
            for (const context of contexts) {
                let entry = contextMap.get(context);
                if (!entry) {
                    let ctx = context;
                    let contextUrl;
                    if (typeof context === 'string') {
                        // fetch context
                        contextUrl = context;
                        ({ '@context': ctx } = yield this._getDocument({ url: contextUrl }));
                    }
                    // FIXME: validate `ctx` to ensure its a valid JSON-LD context value
                    // add context
                    entry = yield this._addContext({ context: ctx, contextUrl, transformer });
                }
                // clone entry to create new active context entry for context stack
                const newActive = {
                    aliases: {
                        id: new Set(entry.aliases.id),
                        type: new Set(entry.aliases.type)
                    },
                    context,
                    scopedContextMap: new Map(entry.scopedContextMap),
                    termMap: new Map(entry.termMap)
                };
                // push new active context and get old one
                const oldActive = contextStack[contextStack.length - 1];
                contextStack.push(newActive);
                if (!oldActive) {
                    continue;
                }
                // compute `id` and `type` aliases by including any previous aliases that
                // have not been replaced by the new context
                const { aliases, termMap } = newActive;
                for (const key of ['id', 'type']) {
                    for (const alias of oldActive.aliases[key]) {
                        if (!(context[alias] === null || newActive.termMap.has(alias))) {
                            aliases[key].add(alias);
                        }
                    }
                }
                // compute scoped context map by including any scoped contexts that have
                // not been replaced by the new context
                const { scopedContextMap } = newActive;
                for (const [key, value] of oldActive.scopedContextMap) {
                    if (!(context[key] === null || scopedContextMap.has(key))) {
                        scopedContextMap.set(key, value);
                    }
                }
                // compute new terms map
                for (const [key, value] of oldActive.termMap) {
                    if (!(context[key] === null || termMap.has(key))) {
                        termMap.set(key, value);
                    }
                }
            }
        });
    }
    _addContext({ context, contextUrl }) {
        return __awaiter(this, void 0, void 0, function* () {
            const { contextMap, termToId, idToTerm } = this;
            // handle `@import`
            const importUrl = context['@import'];
            if (importUrl) {
                let importEntry = contextMap.get(importUrl);
                if (!importEntry) {
                    const { '@context': importCtx } = yield this._getDocument({ url: importUrl });
                    importEntry = yield this._addContext({ context: importCtx, contextUrl: importUrl });
                }
                context = Object.assign(Object.assign({}, importEntry.context), context);
            }
            // precompute any `@id` and `@type` aliases, scoped contexts, and terms
            const scopedContextMap = new Map();
            const termMap = new Map();
            const entry = {
                aliases: { id: new Set(), type: new Set() },
                context,
                scopedContextMap,
                termMap
            };
            // process context keys in sorted order to ensure term IDs are assigned
            // consistently
            const keys = Object.keys(context).sort();
            for (const key of keys) {
                const def = context[key];
                if (!def) {
                    continue;
                }
                if (def === '@id' || def.id === '@id') {
                    entry.aliases.id.add(key);
                }
                else if (def === '@type' || def.id === '@type') {
                    entry.aliases.type.add(key);
                }
                if (keywords_js_1.KEYWORDS.has(key)) {
                    // skip keywords
                    continue;
                }
                // ensure the term has been assigned an ID
                if (!termToId.has(key)) {
                    const id = this.nextTermId;
                    this.nextTermId += 2;
                    termToId.set(key, id);
                    if (idToTerm) {
                        idToTerm.set(id, key);
                    }
                }
                termMap.set(key, def);
                const scopedContext = def['@context'];
                if (scopedContext) {
                    scopedContextMap.set(key, scopedContext);
                }
            }
            // add entry for context URL or context object
            contextMap.set(contextUrl || context, entry);
            return entry;
        });
    }
    _getDocument({ url }) {
        return __awaiter(this, void 0, void 0, function* () {
            const { document } = yield this.documentLoader(url);
            if (typeof document === 'string') {
                return JSON.parse(document);
            }
            return document;
        });
    }
    _getTermType({ activeCtx, def }) {
        const { '@type': type } = def;
        if (!type) {
            // no term type
            return;
        }
        // check for potential CURIE value
        const [prefix, ...suffix] = type.split(':');
        const prefixDef = activeCtx.termMap.get(prefix);
        if (prefixDef === undefined) {
            // no CURIE
            return type;
        }
        // handle CURIE
        if (typeof prefixDef === 'string') {
            return prefixDef + suffix.join(':');
        }
        // prefix definition must be an object
        if (!(typeof prefixDef === 'object' &&
            typeof prefixDef['@id'] === 'string')) {
            throw new CborldError_js_1.CborldError('ERR_INVALID_TERM_DEFINITION', 'JSON-LD term definitions must be strings or objects with "@id".');
        }
        return prefixDef['@id'] + suffix.join(':');
    }
    _getIdForTerm({ term, plural }) {
        const id = this.termToId.get(term);
        if (id === undefined) {
            throw new CborldError_js_1.CborldError('ERR_UNDEFINED_TERM', 'CBOR-LD compression requires all terms to be defined in a JSON-LD ' +
                'context.');
        }
        return plural ? id + 1 : id;
    }
    _getTermForId({ id }) {
        const plural = (id & 1) === 1;
        const term = this.idToTerm.get(plural ? id - 1 : id);
        return { term, plural };
    }
}
exports.Transformer = Transformer;
/**
 * Fetches a resource given a URL and returns it as a string.
 *
 * @callback documentLoaderFunction
 * @param {string} url - The URL to retrieve.
 *
 * @returns {string} The resource associated with the URL as a string.
 */
//# sourceMappingURL=Transformer.js.map