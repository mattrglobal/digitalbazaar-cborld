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
export function encode({ jsonldDocument, documentLoader, appContextMap, compressionMode, diagnose }?: {
    jsonldDocument: object;
    documentLoader: documentLoaderFunction;
    compressionMode?: boolean | undefined;
    appContextMap?: Map<any, any> | undefined;
    diagnose?: diagnosticFunction | undefined;
}): Promise<Uint8Array>;
/**
 * A diagnostic function that is called with diagnostic information. Typically
 * set to `console.log` when debugging.
 */
export type diagnosticFunction = (message: string) => any;
/**
 * Fetches a resource given a URL and returns it as a string.
 */
export type documentLoaderFunction = (url: string) => string;
//# sourceMappingURL=encode.d.ts.map