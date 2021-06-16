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
export function decode({ cborldBytes, documentLoader, appContextMap, diagnose }: {
    cborldBytes: Uint8Array;
    documentLoader: Function;
    appContextMap?: Map<any, any> | undefined;
    diagnose?: diagnosticFunction | undefined;
}): Promise<object>;
/**
 * A diagnostic function that is called with diagnostic information. Typically
 * set to `console.log` when debugging.
 */
export type diagnosticFunction = (message: string) => any;
//# sourceMappingURL=decode.d.ts.map