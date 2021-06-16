export const TYPE_DECODERS: Map<string, typeof MultibaseDecoder>;
export class Decompressor extends Transformer {
    reverseAppContextMap: Map<any, any>;
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
    decompress({ compressedBytes, diagnose }?: {
        compressedBytes: Uint8Array;
        diagnose?: diagnosticFunction | undefined;
    }): Promise<object>;
    contextMap: Map<any, any> | undefined;
    termToId: Map<string, number> | undefined;
    nextTermId: number | undefined;
    idToTerm: Map<any, any> | undefined;
    _getEntries({ transformMap, termMap }: {
        transformMap: any;
        termMap: any;
    }): any[][];
    _getTermInfo({ termMap, key }: {
        termMap: any;
        key: any;
    }): {
        term: any;
        termId: any;
        plural: boolean;
        def: any;
    };
    _transformObjectId({ obj, termInfo, value }: {
        obj: any;
        termInfo: any;
        value: any;
    }): void;
    _transformObjectType({ obj, termInfo, value }: {
        obj: any;
        termInfo: any;
        value: any;
    }): void;
    _transformTypedValue({ entries, termType, value }: {
        entries: any;
        termType: any;
        value: any;
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
    _assignEntries({ entries, obj, termInfo }: {
        entries: any;
        obj: any;
        termInfo: any;
    }): void;
}
/**
 * Fetches a resource given a URL and returns it as a string.
 */
export type documentLoaderFunction = (url: string) => string;
/**
 * A diagnostic function that is called with diagnostic information. Typically
 * set to `console.log` when debugging.
 */
export type diagnosticFunction = (message: string) => any;
import { MultibaseDecoder } from "./codecs/MultibaseDecoder.js";
import { Transformer } from "./Transformer.js";
//# sourceMappingURL=Decompressor.d.ts.map