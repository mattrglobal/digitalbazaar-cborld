export const TYPE_ENCODERS: Map<string, typeof UriEncoder>;
export class Compressor extends Transformer {
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
    compress({ jsonldDocument, diagnose }?: {
        jsonldDocument: object;
        diagnose?: diagnosticFunction | undefined;
    }): Promise<Uint8Array>;
    _createTransformMaps({ jsonldDocument }: {
        jsonldDocument: any;
    }): Promise<Map<any, any> | Map<any, any>[]>;
    contextMap: Map<any, any> | undefined;
    termToId: Map<string, number> | undefined;
    nextTermId: number | undefined;
    _getEntries({ obj, termMap }: {
        obj: any;
        termMap: any;
    }): any[][];
    _transformObjectId({ transformMap, termInfo, value }: {
        transformMap: any;
        termInfo: any;
        value: any;
    }): void;
    _transformObjectType({ transformMap, termInfo, value }: {
        transformMap: any;
        termInfo: any;
        value: any;
    }): void;
    _transformTypedValue({ entries, termType, value, termInfo }: {
        entries: any;
        termType: any;
        value: any;
        termInfo: any;
    }): true | undefined;
    _transformArray({ entries, contextStack, value }: {
        entries: any;
        contextStack: any;
        value: any;
    }): Promise<void>;
    _transformObject({ entries, contextStack, value }: {
        entries: any;
        contextStack: any;
        value: any;
    }): Promise<void>;
    _assignEntries({ entries, transformMap, termInfo }: {
        entries: any;
        transformMap: any;
        termInfo: any;
    }): void;
}
/**
 * A diagnostic function that is called with diagnostic information. Typically
 * set to `console.log` when debugging.
 */
export type diagnosticFunction = (message: string) => any;
/**
 * Fetches a resource given a URL and returns it as a string.
 */
export type documentLoaderFunction = (url: string) => string;
import { UriEncoder } from "./codecs/UriEncoder.js";
import { Transformer } from "./Transformer.js";
//# sourceMappingURL=Compressor.d.ts.map