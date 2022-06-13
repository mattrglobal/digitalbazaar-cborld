'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var cborg = require('cborg');
var jsBase64 = require('js-base64');
var base58Universal = require('base58-universal');
var uuid = require('uuid');
var node_util = require('node:util');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n["default"] = e;
  return Object.freeze(n);
}

var cborg__namespace = /*#__PURE__*/_interopNamespace(cborg);

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

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
class CborldDecoder {
  // eslint-disable-next-line no-unused-vars
  decode({value} = {}) {
    throw new Error('Must be implemented by derived class.');
  }

  // eslint-disable-next-line no-unused-vars
  static createDecoder({value, transformer} = {}) {
    throw new Error('Must be implemented by derived class.');
  }
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
// known CBOR-LD registry values
const ID_TO_URL = new Map();
const URL_TO_ID = new Map();

/**
 * @see https://digitalbazaar.github.io/cbor-ld-spec/#term-codec-registry
 */
_addRegistration(0x10, 'https://www.w3.org/ns/activitystreams');
_addRegistration(0x11, 'https://www.w3.org/2018/credentials/v1');
_addRegistration(0x12, 'https://www.w3.org/ns/did/v1');
_addRegistration(0x13, 'https://w3id.org/security/suites/ed25519-2018/v1');
_addRegistration(0x14, 'https://w3id.org/security/suites/ed25519-2020/v1');
_addRegistration(0x15, 'https://w3id.org/cit/v1');
_addRegistration(0x16, 'https://w3id.org/age/v1');
_addRegistration(0x17, 'https://w3id.org/security/suites/x25519-2020/v1');
_addRegistration(0x18, 'https://w3id.org/veres-one/v1');
_addRegistration(0x19, 'https://w3id.org/webkms/v1');
_addRegistration(0x1A, 'https://w3id.org/zcap/v1');
_addRegistration(0x1B, 'https://w3id.org/security/suites/hmac-2019/v1');
_addRegistration(0x1C, 'https://w3id.org/security/suites/aes-2019/v1');
_addRegistration(0x1D, 'https://w3id.org/vaccination/v1');
_addRegistration(0x1E, 'https://w3id.org/vc-revocation-list-2020/v1');
_addRegistration(0x1F, 'https://w3id.org/dcc/v1c');
_addRegistration(0x20, 'https://w3id.org/vc/status-list/v1');

function _addRegistration(id, url) {
  URL_TO_ID.set(url, id);
  ID_TO_URL.set(id, url);
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

class ContextDecoder extends CborldDecoder {
  constructor({reverseAppContextMap} = {}) {
    super();
    this.reverseAppContextMap = reverseAppContextMap;
  }

  decode({value} = {}) {
    // handle uncompressed context
    if(typeof value !== 'number') {
      return _mapToObject(value);
    }

    // handle compressed context
    const url = ID_TO_URL.get(value) || this.reverseAppContextMap.get(value);
    if(url === undefined) {
      throw new CborldError(
        'ERR_UNDEFINED_COMPRESSED_CONTEXT',
        `Undefined compressed context "${value}".`);
    }
    return url;
  }

  static createDecoder({transformer} = {}) {
    const {reverseAppContextMap} = transformer;
    return new ContextDecoder({reverseAppContextMap});
  }
}

function _mapToObject(map) {
  if(Array.isArray(map)) {
    return map.map(_mapToObject);
  }
  if(!(map instanceof Map)) {
    return map;
  }

  const obj = {};
  for(const [key, value] of map) {
    obj[key] = _mapToObject(value);
  }
  return obj;
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

// this class is used to encode a multibase encoded value in CBOR-LD, which
// actually means transforming bytes to a multibase-encoded string
class MultibaseDecoder extends CborldDecoder {
  decode({value} = {}) {
    const {buffer, byteOffset, length} = value;
    const suffix = new Uint8Array(buffer, byteOffset + 1, length - 1);
    if(value[0] === 0x7a) {
      // 0x7a === 'z' (multibase code for base58btc)
      return `z${base58Universal.encode(suffix)}`;
    }
    if(value[0] === 0x4d) {
      // 0x4d === 'M' (multibase code for base64pad)
      return `M${jsBase64.Base64.fromUint8Array(suffix)}`;
    }
    return value;
  }

  static createDecoder({value} = {}) {
    if(!(value instanceof Uint8Array)) {
      return false;
    }
    // supported multibase encodings:
    // 0x7a === 'z' (multibase code for base58btc)
    // 0x4d === 'M' (multibase code for base64pad)
    if(value[0] === 0x7a || value[0] === 0x4d) {
      return new MultibaseDecoder();
    }
  }
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
const KEYWORDS = new Map([
  // ordered is important, do not change
  ['@context', 0],
  ['@type', 2],
  ['@id', 4],
  ['@value', 6],
  // alphabetized after `@context`, `@type`, `@id`, `@value`
  // IDs <= 24 represented with 1 byte, IDs > 24 use 2+ bytes
  ['@direction', 8],
  ['@graph', 10],
  ['@included', 12],
  ['@index', 14],
  ['@json', 16],
  ['@language', 18],
  ['@list', 20],
  ['@nest', 22],
  ['@reverse', 24],
  // TODO: remove these? these only appear in frames and contexts
  ['@base', 26],
  ['@container', 28],
  ['@default', 30],
  ['@embed', 32],
  ['@explicit', 34],
  ['@none', 36],
  ['@omitDefault', 38],
  ['@prefix', 40],
  ['@preserve', 42],
  ['@protected', 44],
  ['@requireAll', 46],
  ['@set', 48],
  ['@version', 50],
  ['@vocab', 52]
]);
const FIRST_CUSTOM_TERM_ID = 100;

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

const MAX_CONTEXT_URLS = 10;

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
   * @param {boolean} [options.compressionModeUndefinedTermAllowed] - Allow the
   *   JSON-LD document to contain terms that are not defined in the context.
   *   The original values of the undefined terms will be preserved during
   *   compression. Defaults to `false`, every key that does not have a defined
   *   term will raise an error.
   */
  constructor({appContextMap, documentLoader,
    compressionModeUndefinedTermAllowed} = {}) {
    this.appContextMap = appContextMap;
    this.documentLoader = documentLoader;
    this.compressionModeUndefinedTermAllowed =
      compressionModeUndefinedTermAllowed;
  }

  // default no-op hook functions
  _beforeObjectContexts() {}
  _afterObjectContexts() {}
  _beforeTypeScopedContexts() {}

  async _transform({obj, transformMap, contextStack = []}) {
    // hook before object contexts are applied
    this._beforeObjectContexts({obj, transformMap});

    // apply embedded contexts in the object
    let activeCtx = await this._applyEmbeddedContexts({obj, contextStack});

    // hook after object contexts are applied
    this._afterObjectContexts({obj, transformMap});

    // TODO: support `@propagate: true` on type-scoped contexts; until then
    // throw an error if it is set

    // preserve context stack before applying type-scoped contexts
    const childContextStack = contextStack.slice();

    // hook before type-scoped contexts are applied
    this._beforeTypeScopedContexts({activeCtx, obj, transformMap});

    // apply type-scoped contexts
    activeCtx = await this._applyTypeScopedContexts({obj, contextStack});

    // walk term entries to transform
    const {aliases, scopedContextMap, termMap} = activeCtx;
    const termEntries = this._getEntries(
      {obj, transformMap, transformer: this, termMap});
    for(const [termInfo, value] of termEntries) {
      const {term} = termInfo;

      // transform `@id`
      if(term === '@id' || aliases.id.has(term)) {
        this._transformObjectId({obj, transformMap, termInfo, value});
        continue;
      }

      // transform `@type`
      if(term === '@type' || aliases.type.has(term)) {
        this._transformObjectType({obj, transformMap, termInfo, value});
        continue;
      }

      // use `childContextStack` when processing properties as it will remove
      // type-scoped contexts unless a property-scoped context is applied
      let propertyContextStack = childContextStack;

      // apply any property-scoped context
      let newActiveCtx;
      const propertyScopedContext = scopedContextMap.get(term);
      if(propertyScopedContext) {
        // TODO: support `@propagate: false` on property-scoped contexts; until
        // then throw an error if it is set
        newActiveCtx = await this._applyEmbeddedContexts({
          obj: {'@context': propertyScopedContext},
          contextStack
        });
        propertyContextStack = contextStack.slice();
      }

      // iterate through all values for the current transform entry
      const {plural, def} = termInfo;
      const termType = this._getTermType(
        {activeCtx: newActiveCtx || activeCtx, def});
      const values = plural ? value : [value];
      const entries = [];
      for(const value of values) {
        // `null` is never transformed
        if(value === null) {
          entries.push(null);
          continue;
        }

        // try to transform typed value
        if(this._transformTypedValue({entries, termType, value, termInfo})) {
          continue;
        }

        if(typeof value !== 'object') {
          // value not transformed and cannot recurse, so do not transform
          entries.push(value);
          continue;
        }

        // transform array
        if(Array.isArray(value)) {
          await this._transformArray(
            {entries, contextStack: propertyContextStack, value});
          continue;
        }

        // transform object
        await this._transformObject({
          entries, contextStack: propertyContextStack, value});
      }

      // revert property-scoped active context if one was created
      if(newActiveCtx) {
        newActiveCtx.revert();
      }

      this._assignEntries({entries, obj, transformMap, termInfo});
    }

    // revert active context for this object
    activeCtx.revert();
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
  async _applyEmbeddedContexts({obj, contextStack}) {
    const stackTop = contextStack.length;

    // push any local embedded contexts onto the context stack
    const localContexts = obj['@context'];
    await this._updateContextStack({contextStack, contexts: localContexts});

    // get `id` and `type` aliases for the active context
    let active = contextStack[contextStack.length - 1];
    if(!active) {
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

    return {
      ...active,
      revert() {
        contextStack.length = stackTop;
      }
    };
  }

  async _applyTypeScopedContexts({obj, contextStack}) {
    const stackTop = contextStack.length;

    // get `id` and `type` aliases for the active context
    let active = contextStack[contextStack.length - 1];
    if(!active) {
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
    const {aliases} = active;

    // get unique object type(s)
    let totalTypes = [];
    const typeTerms = ['@type', ...aliases.type];
    for(const term of typeTerms) {
      const types = obj[term];
      if(Array.isArray(types)) {
        totalTypes.push(...types);
      } else {
        totalTypes.push(types);
      }
    }
    // apply types in lexicographically sorted order (per JSON-LD spec)
    totalTypes = [...new Set(totalTypes)].sort();

    // apply any type-scoped contexts
    let {scopedContextMap} = active;
    for(const type of totalTypes) {
      const contexts = scopedContextMap.get(type);
      if(contexts) {
        await this._updateContextStack({contextStack, contexts});
        active = contextStack[contextStack.length - 1];
        ({scopedContextMap} = active);
      }
    }

    return {
      ...active,
      revert() {
        contextStack.length = stackTop;
      }
    };
  }

  async _updateContextStack({contextStack, contexts, transformer,
    cycles = new Set()}) {
    // push any localized contexts onto the context stack
    if(!contexts) {
      return;
    }
    if(!Array.isArray(contexts)) {
      contexts = [contexts];
    }

    const {contextMap} = this;
    for(const context of contexts) {
      let entry = contextMap.get(context);
      if(!entry) {
        let ctx = context;
        let contextUrl;
        if(typeof context === 'string') {
          // check for context URL cycle
          if(cycles.has(context)) {
            throw new CborldError(
              'ERR_CYCLICAL_CONTEXT_URL',
              `Cyclical @context URL '${context}' was detected.`);
          }

          // check for max context URLs fetched during a resolve operation
          if(cycles.size > MAX_CONTEXT_URLS) {
            throw new CborldError(
              'ERR_EXCEEDED_MAX_CONTEXT_URLS',
              'Maximum number of @context URLs exceeded.');
          }

          // fetch context
          contextUrl = context;
          ({'@context': ctx} = await this._getDocument({url: contextUrl}));
        }

        // support parsing context lists recursively. only top-level @context or
        // or remote context can be an array based on the JSON-LD spec.
        if(Array.isArray(ctx) || typeof ctx === 'string') {

          // track cycles
          const branch = new Set(cycles.values());
          branch.add(context);

          await this._updateContextStack({
            contextStack,
            contexts: ctx,
            cycles: branch
          });
          continue;
        }

        // FIXME: validate `ctx` to ensure its a valid JSON-LD context value
        // add context
        entry = await this._addContext({context: ctx, contextUrl, transformer});
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
      if(!oldActive) {
        continue;
      }

      // compute `id` and `type` aliases by including any previous aliases that
      // have not been replaced by the new context
      const {aliases, termMap} = newActive;
      for(const key of ['id', 'type']) {
        for(const alias of oldActive.aliases[key]) {
          if(!(context[alias] === null || newActive.termMap.has(alias))) {
            aliases[key].add(alias);
          }
        }
      }

      // compute scoped context map by including any scoped contexts that have
      // not been replaced by the new context
      const {scopedContextMap} = newActive;
      for(const [key, value] of oldActive.scopedContextMap) {
        if(!(context[key] === null || scopedContextMap.has(key))) {
          scopedContextMap.set(key, value);
        }
      }

      // compute new terms map
      for(const [key, value] of oldActive.termMap) {
        if(!(context[key] === null || termMap.has(key))) {
          termMap.set(key, value);
        }
      }
    }
  }

  async _addContext({context, contextUrl}) {
    const {contextMap, termToId, idToTerm} = this;

    // handle `@import`
    const importUrl = context['@import'];
    if(importUrl) {
      let importEntry = contextMap.get(importUrl);
      if(!importEntry) {
        const {'@context': importCtx} = await this._getDocument(
          {url: importUrl});
        importEntry = await this._addContext(
          {context: importCtx, contextUrl: importUrl});
      }
      context = {...importEntry.context, ...context};
    }

    // precompute any `@id` and `@type` aliases, scoped contexts, and terms
    const scopedContextMap = new Map();
    const termMap = new Map();
    const entry = {
      aliases: {id: new Set(), type: new Set()},
      context,
      scopedContextMap,
      termMap
    };

    // process context keys in sorted order to ensure term IDs are assigned
    // consistently
    const keys = Object.keys(context).sort();
    for(const key of keys) {
      const def = context[key];
      if(!def) {
        continue;
      }
      if(def === '@id' || def.id === '@id') {
        entry.aliases.id.add(key);
      } else if(def === '@type' || def.id === '@type') {
        entry.aliases.type.add(key);
      }
      if(KEYWORDS.has(key)) {
        // skip keywords
        continue;
      }
      // ensure the term has been assigned an ID
      if(!termToId.has(key)) {
        const id = this.nextTermId;
        this.nextTermId += 2;
        termToId.set(key, id);
        if(idToTerm) {
          idToTerm.set(id, key);
        }
      }
      termMap.set(key, def);
      const scopedContext = def['@context'];
      if(scopedContext) {
        scopedContextMap.set(key, scopedContext);
      }
    }

    // add entry for context URL or context object
    contextMap.set(contextUrl || context, entry);

    return entry;
  }

  async _getDocument({url}) {
    const {document} = await this.documentLoader(url);
    if(typeof document === 'string') {
      return JSON.parse(document);
    }
    return document;
  }

  _getTermType({activeCtx, def}) {
    const {'@type': type} = def || {};
    if(!type) {
      // no term type
      return;
    }

    // check for potential CURIE value
    const [prefix, ...suffix] = type.split(':');
    const prefixDef = activeCtx.termMap.get(prefix);
    if(prefixDef === undefined) {
      // no CURIE
      return type;
    }

    // handle CURIE
    if(typeof prefixDef === 'string') {
      return prefixDef + suffix.join(':');
    }

    // prefix definition must be an object
    if(!(typeof prefixDef === 'object' &&
      typeof prefixDef['@id'] === 'string')) {
      throw new CborldError(
        'ERR_INVALID_TERM_DEFINITION',
        'JSON-LD term definitions must be strings or objects with "@id".');
    }
    return prefixDef['@id'] + suffix.join(':');
  }

  _getIdForTerm({term, plural}) {
    const id = this.termToId.get(term);
    if(id === undefined) {
      // preserve the original term key if undefined terms are allowed
      if(this.compressionModeUndefinedTermAllowed) {
        return term;
      }
      throw new CborldError(
        'ERR_UNDEFINED_TERM',
        'CBOR-LD compression requires all terms to be defined in a JSON-LD ' +
        'context.');
    }
    return plural ? id + 1 : id;
  }

  _getTermForId({id}) {
    const plural = (id & 1) === 1;
    const term = this.idToTerm.get(plural ? id - 1 : id);
    return {term, plural};
  }
}

/**
 * Fetches a resource given a URL and returns it as a string.
 *
 * @callback documentLoaderFunction
 * @param {string} url - The URL to retrieve.
 *
 * @returns {string} The resource associated with the URL as a string.
 */

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

const ID_TO_SCHEME = new Map([
  // Note: only v1 mainnet is supported
  [1024, 'did:v1:nym:'],
  [1025, 'did:key:']
]);

class Base58DidUrlDecoder extends CborldDecoder {
  decode({value} = {}) {
    let url = ID_TO_SCHEME.get(value[0]);
    if(typeof value[1] === 'string') {
      url += value[1];
    } else {
      url += `z${base58Universal.encode(value[1])}`;
    }
    if(value.length > 2) {
      if(typeof value[2] === 'string') {
        url += `#${value[2]}`;
      } else {
        url += `#z${base58Universal.encode(value[2])}`;
      }
    }
    return url;
  }

  static createDecoder({value} = {}) {
    if(!(Array.isArray(value) && value.length > 1 && value.length <= 3)) {
      return false;
    }
    if(!ID_TO_SCHEME.has(value[0])) {
      return false;
    }
    return new Base58DidUrlDecoder();
  }
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

class HttpUrlDecoder extends CborldDecoder {
  constructor({secure} = {}) {
    super();
    this.secure = secure;
  }

  decode({value} = {}) {
    const scheme = this.secure ? 'https://' : 'http://';
    return `${scheme}${value[1]}`;
  }

  static createDecoder({value} = {}) {
    if(!(value.length === 2 && typeof value[1] === 'string')) {
      return false;
    }
    return new HttpUrlDecoder({secure: value[0] === 2});
  }
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

class UuidUrnDecoder extends CborldDecoder {
  decode({value} = {}) {
    const uuid$1 = typeof value[1] === 'string' ?
      value[1] : uuid.stringify(value[1]);
    return `urn:uuid:${uuid$1}`;
  }

  static createDecoder({value} = {}) {
    if(value.length === 2 &&
      (typeof value[1] === 'string' || value[1] instanceof Uint8Array)) {
      return new UuidUrnDecoder();
    }
  }
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

const SCHEME_ID_TO_DECODER = new Map([
  [1, HttpUrlDecoder],
  [2, HttpUrlDecoder],
  [3, UuidUrnDecoder],
  [1024, Base58DidUrlDecoder],
  [1025, Base58DidUrlDecoder]
]);

class UriDecoder extends CborldDecoder {
  static createDecoder({value} = {}) {
    if(!(Array.isArray(value) || value.length > 1)) {
      return false;
    }

    const DecoderClass = SCHEME_ID_TO_DECODER.get(value[0]);
    return DecoderClass && DecoderClass.createDecoder({value});
  }
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

class VocabTermDecoder extends CborldDecoder {
  constructor({term} = {}) {
    super();
    this.term = term;
  }

  decode() {
    return this.term;
  }

  static createDecoder({value, transformer} = {}) {
    if(Array.isArray(value)) {
      return UriDecoder.createDecoder({value, transformer});
    }
    const term = transformer.idToTerm.get(value);
    if(term !== undefined) {
      return new VocabTermDecoder({term});
    }
  }
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

class XsdDateDecoder extends CborldDecoder {
  decode({value} = {}) {
    const dateString = new Date(value * 1000).toISOString();
    return dateString.substring(0, dateString.indexOf('T'));
  }

  static createDecoder({value} = {}) {
    if(typeof value === 'number') {
      return new XsdDateDecoder();
    }
  }
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

class XsdDateTimeDecoder extends CborldDecoder {
  constructor({value} = {}) {
    super();
    this.value = value;
  }

  decode({value} = {}) {
    if(typeof value === 'number') {
      return new Date(value * 1000).toISOString().replace('.000Z', 'Z');
    }
    return new Date(value[0] * 1000 + value[1]).toISOString();
  }

  static createDecoder({value} = {}) {
    if(typeof value === 'number') {
      return new XsdDateTimeDecoder();
    }
    if(Array.isArray(value) && value.length === 2 &&
      (typeof value[0] === 'number' || typeof value[1] === 'number')) {
      return new XsdDateTimeDecoder();
    }
  }
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

const TYPE_DECODERS = new Map([
  ['@id', UriDecoder],
  ['@vocab', VocabTermDecoder],
  ['https://w3id.org/security#multibase', MultibaseDecoder],
  ['http://www.w3.org/2001/XMLSchema#date', XsdDateDecoder],
  ['http://www.w3.org/2001/XMLSchema#dateTime', XsdDateTimeDecoder]
]);

const CONTEXT_TERM_ID$1 = KEYWORDS.get('@context');
const CONTEXT_TERM_ID_PLURAL$1 = CONTEXT_TERM_ID$1 + 1;

class Decompressor extends Transformer {
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
   * @param {boolean} [options.compressionModeUndefinedTermAllowed] - Allow the
   *   JSON-LD document to contain terms that are not defined in the context.
   *   The original values of terms that cannot be resolved from the context map
   *   will be preserved. Defaults to `false`, every key that does not have a
   *   defined term will raise an error.
   */
  constructor({documentLoader, appContextMap,
    compressionModeUndefinedTermAllowed} = {}) {
    super({documentLoader, appContextMap, compressionModeUndefinedTermAllowed});
    this.reverseAppContextMap = new Map();
    // build reverse contxt map
    if(appContextMap) {
      for(const [k, v] of appContextMap) {
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
  async decompress({compressedBytes, diagnose} = {}) {
    this.contextMap = new Map();
    this.termToId = new Map(KEYWORDS);
    this.nextTermId = FIRST_CUSTOM_TERM_ID;
    this.idToTerm = new Map();
    for(const [term, id] of this.termToId) {
      this.idToTerm.set(id, term);
    }

    // decoded output could be one or more transform maps
    const transformMap = cborg__namespace.decode(compressedBytes, {useMaps: true});
    if(diagnose) {
      diagnose('Diagnostic CBOR-LD decompression transform map(s):');
      diagnose(node_util.inspect(transformMap, {depth: null, colors: true}));
    }

    // handle single or multiple JSON-LD docs
    const results = [];
    const isArray = Array.isArray(transformMap);
    const transformMaps = isArray ? transformMap : [transformMap];
    for(const transformMap of transformMaps) {
      const obj = {};
      await this._transform({obj, transformMap});
      results.push(obj);
    }
    return isArray ? results : results[0];
  }

  _beforeObjectContexts({obj, transformMap}) {
    // decode `@context` for `transformMap`, if any
    const encodedContext = transformMap.get(CONTEXT_TERM_ID$1);
    if(encodedContext) {
      const decoder = ContextDecoder.createDecoder(
        {value: encodedContext, transformer: this});
      obj['@context'] = decoder ?
        decoder.decode({value: encodedContext}) : encodedContext;
    }
    const encodedContexts = transformMap.get(CONTEXT_TERM_ID_PLURAL$1);
    if(encodedContexts) {
      if(encodedContext) {
        // can't use *both* the singular and plural context term ID
        throw new CborldError(
          'ERR_INVALID_ENCODED_CONTEXT',
          'Both singular and plural context IDs were found in the ' +
          'CBOR-LD input.');
      }
      if(!Array.isArray(encodedContexts)) {
        // `encodedContexts` must be an array
        throw new CborldError(
          'ERR_INVALID_ENCODED_CONTEXT',
          'Encoded plural context value must be an array.');
      }
      const entries = [];
      for(const value of encodedContexts) {
        const decoder = ContextDecoder.createDecoder(
          {value, transformer: this});
        entries.push(decoder ? decoder.decode({value}) : value);
      }
      obj['@context'] = entries;
    }
  }

  _beforeTypeScopedContexts({activeCtx, obj, transformMap}) {
    // decode object types
    const {termToId} = this;
    const typeTerms = ['@type', ...activeCtx.aliases.type];
    for(const term of typeTerms) {
      // check both singular and plural term IDs
      const termId = termToId.get(term);
      let value = transformMap.get(termId);
      if(value === undefined) {
        value = transformMap.get(termId + 1);
      }
      if(value !== undefined) {
        if(Array.isArray(value)) {
          obj[term] = value.map(value => {
            const decoder = VocabTermDecoder.createDecoder(
              {value, transformer: this});
            return decoder ? decoder.decode({value}) : value;
          });
        } else {
          const decoder = VocabTermDecoder.createDecoder(
            {value, transformer: this});
          obj[term] = decoder ? decoder.decode({value}) : value;
        }
      }
    }
  }

  _getEntries({transformMap, termMap}) {
    // get term entries to be transformed and sort by *term* to ensure term
    // IDs will be assigned in the same order that the compressor assigned them
    const entries = [];
    for(const [key, value] of transformMap) {
      // skip `@context`; not a term entry
      if(key === CONTEXT_TERM_ID$1 || key === CONTEXT_TERM_ID_PLURAL$1) {
        continue;
      }

      // check for undefined term IDs
      const {term, plural} = this._getTermForId({id: key});
      if(term === undefined && !this.compressionModeUndefinedTermAllowed) {
        throw new CborldError(
          'ERR_UNKNOWN_CBORLD_TERM_ID',
          `Unknown term ID '${key}' was detected in the CBOR-LD input.`);
      }

      // preserve the original term key if undefined terms are allowed
      if(term === undefined && this.compressionModeUndefinedTermAllowed) {
        if(typeof key !== 'string') {
          throw new CborldError(
            'ERR_UNKNOWN_CBORLD_TERM_ID',
            `Unknown term ID "${key}" was detected in the CBOR-LD input. ` +
              `Expected term key to be a string for undefined terms when ` +
              `"compressionModeUndefinedTermAllowed" is enabled. The JSON-LD ` +
              `document must also be encoded with the same policy.`);
        }
        entries.push([{
          term: key,
          termId: key,
          plural: Array.isArray(value),
          def: {'@type': undefined}
        }, value]);
        continue;
      }

      // check for undefined term
      const def = termMap.get(term);
      if(def === undefined && !(term.startsWith('@') && KEYWORDS.has(term))) {
        throw new CborldError(
          'ERR_UNKNOWN_CBORLD_TERM',
          `Unknown term "${term}" was detected in the CBOR-LD input.`);
      }

      entries.push([{term, termId: key, plural, def}, value]);
    }
    return entries.sort(_sortEntriesByTerm);
  }

  _getTermInfo({termMap, key}) {
    // check for undefined term IDs
    const {term, plural} = this._getTermForId({id: key});
    if(term === undefined) {
      throw new CborldError(
        'ERR_UNKNOWN_CBORLD_TERM_ID',
        `Unknown term ID '${key}' was detected in the CBOR-LD input.`);
    }

    // check for undefined term
    const def = termMap.get(term);
    if(def === undefined && !(term.startsWith('@') && KEYWORDS.has(term))) {
      throw new CborldError(
        'ERR_UNKNOWN_CBORLD_TERM',
        `Unknown term "${term}" was detected in the CBOR-LD input.`);
    }

    return {term, termId: key, plural, def};
  }

  _transformObjectId({obj, termInfo, value}) {
    const decoder = UriDecoder.createDecoder({value});
    obj[termInfo.term] = decoder ? decoder.decode({value}) : value;
  }

  _transformObjectType({obj, termInfo, value}) {
    const {term, plural} = termInfo;
    const values = plural ? value : [value];
    const entries = [];
    for(const value of values) {
      const decoder = VocabTermDecoder.createDecoder(
        {value, transformer: this});
      entries.push(decoder ? decoder.decode({value}) : value);
    }
    obj[term] = plural ? entries : entries[0];
  }

  _transformTypedValue({entries, termType, value}) {
    const DecoderClass = TYPE_DECODERS.get(termType);
    const decoder = DecoderClass && DecoderClass.createDecoder(
      {value, transformer: this});
    if(decoder) {
      entries.push(decoder.decode({value}));
      return true;
    }
  }

  async _transformArray({entries, contextStack, value}) {
    // recurse into array
    const children = [];
    for(const transformMap of value) {
      const obj = {};
      children.push(obj);
      await this._transform({obj, transformMap, contextStack});
    }
    entries.push(children);
  }

  async _transformObject({entries, contextStack, value}) {
    // recurse into object
    const child = {};
    entries.push(child);
    return this._transform({obj: child, transformMap: value, contextStack});
  }

  _assignEntries({entries, obj, termInfo}) {
    const {term, plural} = termInfo;
    obj[term] = plural ? entries : entries[0];
  }
}

function _sortEntriesByTerm([{term: t1}], [{term: t2}]) {
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

/*!
 * Copyright (c) 2020-2021 Digital Bazaar, Inc. All rights reserved.
 */

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
 * @param {boolean} [options.compressionModeUndefinedTermAllowed] - Allow the
 *   JSON-LD document to contain terms that are not defined in the context. The
 *   original values of terms that cannot be resolved from the context map will
 *   be preserved. Defaults to `false`, every key that does not have a defined
 *   term will raise an error.
 * @param {diagnosticFunction} [options.diagnose] - A function that, if
 *   provided, is called with diagnostic information.
 *
 * @returns {Promise<object>} - The decoded JSON-LD Document.
 */
async function decode({
  cborldBytes, documentLoader, appContextMap = new Map(),
  compressionModeUndefinedTermAllowed = false, diagnose
}) {
  if(!(cborldBytes instanceof Uint8Array)) {
    throw new TypeError('"cborldBytes" must be a Uint8Array.');
  }

  // 0xd9 == 11011001
  // 110 = CBOR major type 6
  // 11001 = 25, 16-bit tag size (65536 possible values)
  let index = 0;
  if(cborldBytes[index++] !== 0xd9) {
    throw new CborldError(
      'ERR_NOT_CBORLD',
      'CBOR-LD must start with a CBOR major type "Tag" header of `0xd9`.');
  }

  // ensure `cborldBytes` represent CBOR-LD
  if(cborldBytes[index++] !== 0x05) {
    throw new CborldError(
      'ERR_NOT_CBORLD', 'CBOR-LD 16-bit tag must start with `0x05`.');
  }

  const compressionMode = cborldBytes[index];
  if(compressionMode === undefined) {
    throw new CborldError(
      'ERR_NOT_CBORLD', 'Truncated CBOR-LD 16-bit tag.');
  }

  if(!(compressionMode === 0 || compressionMode === 1)) {
    throw new CborldError(
      'ERR_NOT_CBORLD',
      `Unsupported CBOR-LD compression mode "${compressionMode}".`);
  }

  index++;
  const {buffer, byteOffset, length} = cborldBytes;
  const suffix = new Uint8Array(buffer, byteOffset + index, length - index);

  // handle uncompressed CBOR-LD
  if(compressionMode === 0) {
    return cborg__namespace.decode(suffix, {useMaps: false});
  }

  // decompress CBOR-LD
  const decompressor = new Decompressor(
    {documentLoader, appContextMap, compressionModeUndefinedTermAllowed});
  const result = await decompressor.decompress(
    {compressedBytes: suffix, diagnose});

  if(diagnose) {
    diagnose('Diagnostic JSON-LD result:');
    diagnose(node_util.inspect(result, {depth: null, colors: true}));
  }

  return result;
}

/**
 * A diagnostic function that is called with diagnostic information. Typically
 * set to `console.log` when debugging.
 *
 * @callback diagnosticFunction
 * @param {string} message - The diagnostic message.
 */

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
class CborldEncoder {
  encode() {
    throw new Error('Must be implemented by derived class.');
  }

  // eslint-disable-next-line no-unused-vars
  static createEncoder({value} = {}) {
    throw new Error('Must be implemented by derived class.');
  }
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

class ContextEncoder extends CborldEncoder {
  constructor({context, appContextMap} = {}) {
    super();
    this.context = context;
    this.appContextMap = appContextMap;
  }

  encode() {
    const {context} = this;
    const id = URL_TO_ID.get(context) || this.appContextMap.get(context);
    if(id === undefined) {
      return new cborg.Token(cborg.Type.string, context);
    }
    return new cborg.Token(cborg.Type.uint, id);
  }

  static createEncoder({value, transformer} = {}) {
    if(typeof value !== 'string') {
      return false;
    }
    const {appContextMap} = transformer;
    return new ContextEncoder({context: value, appContextMap});
  }
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

// this class is used to encode a multibase encoded value in CBOR-LD, which
// actually means transforming a multibase-encoded string to bytes
class MultibaseEncoder extends CborldEncoder {
  constructor({value} = {}) {
    super();
    this.value = value;
  }

  encode() {
    const {value} = this;

    let prefix;
    let suffix;
    if(value[0] === 'z') {
      // 0x7a === 'z' (multibase code for base58btc)
      prefix = 0x7a;
      suffix = base58Universal.decode(value.substr(1));
    } else if(value[0] === 'M') {
      // 0x4d === 'M' (multibase code for base64pad)
      prefix = 0x4d;
      suffix = jsBase64.Base64.toUint8Array(value.substr(1));
    }

    const bytes = new Uint8Array(1 + suffix.length);
    bytes[0] = prefix;
    bytes.set(suffix, 1);
    return new cborg.Token(cborg.Type.bytes, bytes);
  }

  static createEncoder({value} = {}) {
    if(typeof value !== 'string') {
      return false;
    }
    // supported multibase encodings:
    // 0x7a === 'z' (multibase code for base58btc)
    // 0x4d === 'M' (multibase code for base64pad)
    if(value[0] === 'z' || value[0] === 'M') {
      return new MultibaseEncoder({value});
    }
  }
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

const SCHEME_TO_ID = new Map([
  ['did:v1:nym:', 1024],
  ['did:key:', 1025]
]);

class Base58DidUrlEncoder extends CborldEncoder {
  constructor({value, scheme} = {}) {
    super();
    this.value = value;
    this.scheme = scheme;
  }

  encode() {
    const {value, scheme} = this;
    const suffix = value.substr(scheme.length);
    const [authority, fragment] = suffix.split('#');
    const entries = [
      new cborg.Token(cborg.Type.uint, SCHEME_TO_ID.get(scheme)),
      _multibase58ToToken(authority)
    ];
    if(fragment !== undefined) {
      entries.push(_multibase58ToToken(fragment));
    }
    return [new cborg.Token(cborg.Type.array, entries.length), entries];
  }

  static createEncoder({value} = {}) {
    const keys = [...SCHEME_TO_ID.keys()];
    for(const key of keys) {
      if(value.startsWith(key)) {
        return new Base58DidUrlEncoder({value, scheme: key});
      }
    }
  }
}

function _multibase58ToToken(str) {
  if(str.startsWith('z')) {
    const decoded = base58Universal.decode(str.substr(1));
    if(decoded) {
      return new cborg.Token(cborg.Type.bytes, decoded);
    }
  }
  // cannot compress
  return new cborg.Token(cborg.Type.string, str);
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

class HttpUrlEncoder extends CborldEncoder {
  constructor({value, secure} = {}) {
    super();
    this.value = value;
    this.secure = secure;
  }

  encode() {
    const {value, secure} = this;
    const length = secure ? 'https://'.length : 'http://'.length;
    const entries = [
      new cborg.Token(cborg.Type.uint, secure ? 2 : 1),
      new cborg.Token(cborg.Type.string, value.substr(length))
    ];
    return [new cborg.Token(cborg.Type.array, entries.length), entries];
  }

  static createEncoder({value} = {}) {
    // presume HTTPS is more common, check for it first
    if(value.startsWith('https://')) {
      return new HttpUrlEncoder({value, secure: true});
    }
    if(value.startsWith('http://')) {
      return new HttpUrlEncoder({value, secure: false});
    }
  }
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

class UuidUrnEncoder extends CborldEncoder {
  constructor({value} = {}) {
    super();
    this.value = value;
  }

  encode() {
    const {value} = this;
    const rest = value.substr('urn:uuid:'.length);
    const entries = [new cborg.Token(cborg.Type.uint, 3)];
    if(rest.toLowerCase() === rest) {
      const uuidBytes = uuid.parse(rest);
      entries.push(new cborg.Token(cborg.Type.bytes, uuidBytes));
    } else {
      // cannot compress
      entries.push(new cborg.Token(cborg.Type.string, rest));
    }
    return [new cborg.Token(cborg.Type.array, entries.length), entries];
  }

  static createEncoder({value} = {}) {
    if(value.startsWith('urn:uuid:')) {
      return new UuidUrnEncoder({value});
    }
  }
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

const SCHEME_TO_ENCODER = new Map([
  ['http', HttpUrlEncoder],
  ['https', HttpUrlEncoder],
  ['urn:uuid', UuidUrnEncoder],
  ['did:v1:nym', Base58DidUrlEncoder],
  ['did:key', Base58DidUrlEncoder]
]);

class UriEncoder extends CborldEncoder {
  static createEncoder({value} = {}) {
    if(typeof value !== 'string') {
      return false;
    }

    // get full colon-delimited prefix
    let scheme;
    try {
      // this handles URIs both with authority followed by `//` and without
      const {protocol, pathname} = new URL(value);
      scheme = protocol;
      if(pathname.includes(':')) {
        scheme += pathname;
      }
      const split = value.split(':');
      split.pop();
      scheme = split.join(':');
    } catch(e) {
      return false;
    }

    const EncoderClass = SCHEME_TO_ENCODER.get(scheme);
    return EncoderClass && EncoderClass.createEncoder({value});
  }
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

class VocabTermEncoder extends CborldEncoder {
  constructor({termId} = {}) {
    super();
    this.termId = termId;
  }

  encode() {
    return new cborg.Token(cborg.Type.uint, this.termId);
  }

  static createEncoder({value, transformer} = {}) {
    const {termToId} = transformer;
    const termId = termToId.get(value);
    if(termId !== undefined) {
      return new VocabTermEncoder({termId});
    }
    return UriEncoder.createEncoder({value});
  }
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

class XsdDateEncoder extends CborldEncoder {
  constructor({value, parsed} = {}) {
    super();
    this.value = value;
    this.parsed = parsed;
  }

  encode() {
    const {value, parsed} = this;
    const secondsSinceEpoch = Math.floor(parsed / 1000);
    const dateString = new Date(secondsSinceEpoch * 1000).toISOString();
    const expectedDate = dateString.substring(0, dateString.indexOf('T'));
    if(value !== expectedDate) {
      // compression would be lossy, do not compress
      return new cborg.Token(cborg.Type.string, value);
    }
    return new cborg.Token(cborg.Type.uint, secondsSinceEpoch);
  }

  static createEncoder({value} = {}) {
    if(value.includes('T')) {
      // time included, cannot compress
      return false;
    }
    const parsed = Date.parse(value);
    if(isNaN(parsed)) {
      // no date parsed, cannot compress
      return false;
    }

    return new XsdDateEncoder({value, parsed});
  }
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

class XsdDateTimeEncoder extends CborldEncoder {
  constructor({value, parsed} = {}) {
    super();
    this.value = value;
    this.parsed = parsed;
  }

  encode() {
    const {value, parsed} = this;
    const secondsSinceEpoch = Math.floor(parsed / 1000);
    const secondsToken = new cborg.Token(cborg.Type.uint, secondsSinceEpoch);
    const millisecondIndex = value.indexOf('.');
    if(millisecondIndex === -1) {
      const expectedDate = new Date(
        secondsSinceEpoch * 1000).toISOString().replace('.000Z', 'Z');
      if(value !== expectedDate) {
        // compression would be lossy, do not compress
        return new cborg.Token(cborg.Type.string, value);
      }
      // compress with second precision
      return secondsToken;
    }

    const milliseconds = parseInt(value.substr(millisecondIndex + 1), 10);
    const expectedDate = new Date(
      secondsSinceEpoch * 1000 + milliseconds).toISOString();
    if(value !== expectedDate) {
      // compress would be lossy, do not compress
      return new cborg.Token(cborg.Type.string, value);
    }

    // compress with subsecond precision
    const entries = [
      secondsToken,
      new cborg.Token(cborg.Type.uint, milliseconds)
    ];
    return [new cborg.Token(cborg.Type.array, entries.length), entries];
  }

  static createEncoder({value} = {}) {
    if(!value.includes('T')) {
      // no time included, cannot compress
      return false;
    }
    const parsed = Date.parse(value);
    if(isNaN(parsed)) {
      // no date parsed, cannot compress
      return false;
    }

    return new XsdDateTimeEncoder({value, parsed});
  }
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

const TYPE_ENCODERS = new Map([
  ['@id', UriEncoder],
  ['@vocab', VocabTermEncoder],
  ['https://w3id.org/security#multibase', MultibaseEncoder],
  ['http://www.w3.org/2001/XMLSchema#date', XsdDateEncoder],
  ['http://www.w3.org/2001/XMLSchema#dateTime', XsdDateTimeEncoder]
]);

const CONTEXT_TERM_ID = KEYWORDS.get('@context');
const CONTEXT_TERM_ID_PLURAL = CONTEXT_TERM_ID + 1;

// override cborg object encoder to use cborld encoders
const typeEncoders = {
  Object(obj) {
    if(obj instanceof CborldEncoder) {
      return obj.encode({obj});
    }
  }
};

class Compressor extends Transformer {
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
   * @param {boolean} [options.compressionModeUndefinedTermAllowed] - Allow the
   *   JSON-LD document to contain terms that are not defined in the context.
   *   The original values of the undefined terms will be preserved during
   *   compression. Defaults to `false`, every key that does not have a defined
   *   term will raise an error.
   */
  constructor({documentLoader, appContextMap,
    compressionModeUndefinedTermAllowed} = {}) {
    super({documentLoader, appContextMap, compressionModeUndefinedTermAllowed});
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
  async compress({jsonldDocument, diagnose} = {}) {
    const transformMaps = await this._createTransformMaps({jsonldDocument});
    if(diagnose) {
      diagnose('Diagnostic CBOR-LD compression transform map(s):');
      diagnose(node_util.inspect(transformMaps, {depth: null, colors: true}));
    }
    return cborg__namespace.encode(transformMaps, {typeEncoders});
  }

  async _createTransformMaps({jsonldDocument}) {
    // initialize state
    this.contextMap = new Map();
    this.termToId = new Map(KEYWORDS);
    this.nextTermId = FIRST_CUSTOM_TERM_ID;

    // handle single or multiple JSON-LD docs
    const transformMaps = [];
    const isArray = Array.isArray(jsonldDocument);
    const docs = isArray ? jsonldDocument : [jsonldDocument];
    for(const obj of docs) {
      const transformMap = new Map();
      await this._transform({obj, transformMap});
      transformMaps.push(transformMap);
    }

    return isArray ? transformMaps : transformMaps[0];
  }

  _afterObjectContexts({obj, transformMap}) {
    // if `@context` is present in the object, encode it
    const context = obj['@context'];
    if(!context) {
      return;
    }

    const entries = [];
    const isArray = Array.isArray(context);
    const contexts = isArray ? context : [context];
    for(const value of contexts) {
      const encoder = ContextEncoder.createEncoder(
        {value, transformer: this});
      entries.push(encoder || value);
    }
    const id = isArray ? CONTEXT_TERM_ID_PLURAL : CONTEXT_TERM_ID;
    transformMap.set(id, isArray ? entries : entries[0]);
  }

  _getEntries({obj, termMap}) {
    // get term entries to be transformed and sort by *term* to ensure term
    // IDs will be assigned in the same order that the decompressor will
    const entries = [];
    const keys = Object.keys(obj).sort();
    for(const key of keys) {
      // skip `@context`; not a term entry
      if(key === '@context') {
        continue;
      }

      // check for undefined terms
      const def = termMap.get(key);
      if(
        def === undefined &&
        !(key.startsWith('@') && KEYWORDS.has(key)) &&
        !this.compressionModeUndefinedTermAllowed
      ) {
        throw new CborldError(
          'ERR_UNKNOWN_CBORLD_TERM',
          `Unknown term '${key}' was detected in the JSON-LD input.`);
      }

      const value = obj[key];
      const plural = Array.isArray(value);
      const termId = this._getIdForTerm({term: key, plural});
      entries.push([{term: key, termId, plural, def}, value]);
    }
    return entries;
  }

  _transformObjectId({transformMap, termInfo, value}) {
    const {termId} = termInfo;
    const encoder = UriEncoder.createEncoder(
      {value, transformer: this, termInfo});
    transformMap.set(termId, encoder || value);
  }

  _transformObjectType({transformMap, termInfo, value}) {
    const {termId, plural} = termInfo;
    const values = plural ? value : [value];
    const entries = [];
    for(const value of values) {
      const encoder = VocabTermEncoder.createEncoder(
        {value, transformer: this, termInfo});
      entries.push(encoder || value);
    }
    transformMap.set(termId, plural ? entries : entries[0]);
  }

  _transformTypedValue({entries, termType, value, termInfo}) {
    const EncoderClass = TYPE_ENCODERS.get(termType);
    const encoder = EncoderClass && EncoderClass.createEncoder(
      {value, transformer: this, termInfo});
    if(encoder) {
      entries.push(encoder);
      return true;
    }
  }

  async _transformArray({entries, contextStack, value}) {
    // recurse into array
    const children = [];
    for(const obj of value) {
      const childMap = new Map();
      children.push(childMap);
      await this._transform({obj, transformMap: childMap, contextStack});
    }
    entries.push(children);
  }

  async _transformObject({entries, contextStack, value}) {
    // recurse into object
    const transformMap = new Map();
    entries.push(transformMap);
    await this._transform({obj: value, transformMap, contextStack});
  }

  _assignEntries({entries, transformMap, termInfo}) {
    const {termId, plural} = termInfo;
    transformMap.set(termId, plural ? entries : entries[0]);
  }
}

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

/*!
 * Copyright (c) 2020-2021 Digital Bazaar, Inc. All rights reserved.
 */

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
 * @param {boolean} [options.compressionModeUndefinedTermAllowed] - Allow the
 *   JSON-LD document to contain terms that are not defined in the context. The
 *   original values of the undefined terms will be preserved during
 *   compression. Defaults to `false`, every key that does not have a defined
 *   term will raise an error.
 * @param {diagnosticFunction} [options.diagnose] - A function that, if
 * provided, is called with diagnostic information.
 *
 * @returns {Promise<Uint8Array>} - The encoded CBOR-LD bytes.
 */
async function encode({
  jsonldDocument, documentLoader, appContextMap = new Map(),
  compressionModeUndefinedTermAllowed = false, compressionMode = 1, diagnose
} = {}) {
  if(!(compressionMode === 0 || compressionMode === 1)) {
    throw new TypeError(
      '"compressionMode" must be "0" (no compression) or "1" ' +
      'for compression mode version 1.');
  }

  // 0xd9 == 11011001
  // 110 = CBOR major type 6
  // 11001 = 25, 16-bit tag size (65536 possible values)
  // 0x05 = always the first 8-bits of a CBOR-LD tag
  // compressionMode = last 8-bits of a CBOR-LD tag indicating compression type
  const prefix = new Uint8Array([0xd9, 0x05, compressionMode]);
  let suffix;

  if(compressionMode === 0) {
    // handle uncompressed CBOR-LD
    suffix = cborg__namespace.encode(jsonldDocument);
  } else {
    // compress CBOR-LD
    const compressor = new Compressor(
      {documentLoader, appContextMap, compressionModeUndefinedTermAllowed});
    suffix = await compressor.compress({jsonldDocument, diagnose});
  }

  // concatenate prefix and suffix
  const length = prefix.length + suffix.length;
  const bytes = new Uint8Array(length);
  bytes.set(prefix);
  bytes.set(suffix, prefix.length);

  if(diagnose) {
    diagnose('Diagnostic CBOR-LD result:');
    diagnose(node_util.inspect(bytes, {depth: null, colors: true}));
  }

  return bytes;
}

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

exports.decode = decode;
exports.encode = encode;
//# sourceMappingURL=main.js.map
