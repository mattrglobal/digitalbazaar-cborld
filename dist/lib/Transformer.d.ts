export class Transformer {
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
    constructor({ appContextMap, documentLoader }?: {
        documentLoader: documentLoaderFunction;
        appContextMap?: Map<any, any> | undefined;
    });
    appContextMap: Map<any, any> | undefined;
    documentLoader: documentLoaderFunction;
    _beforeObjectContexts(): void;
    _afterObjectContexts(): void;
    _beforeTypeScopedContexts(): void;
    _transform({ obj, transformMap, contextStack }: {
        obj: any;
        transformMap: any;
        contextStack?: any[] | undefined;
    }): Promise<void>;
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
    _applyEmbeddedContexts({ obj, contextStack }: {
        obj: object;
        contextStack?: any[] | undefined;
    }): Promise<object>;
    _applyTypeScopedContexts({ obj, contextStack }: {
        obj: any;
        contextStack: any;
    }): Promise<any>;
    _updateContextStack({ contextStack, contexts, transformer }: {
        contextStack: any;
        contexts: any;
        transformer: any;
    }): Promise<void>;
    _addContext({ context, contextUrl }: {
        context: any;
        contextUrl: any;
    }): Promise<{
        aliases: {
            id: Set<any>;
            type: Set<any>;
        };
        context: any;
        scopedContextMap: Map<any, any>;
        termMap: Map<any, any>;
    }>;
    _getDocument({ url }: {
        url: any;
    }): Promise<any>;
    _getTermType({ activeCtx, def }: {
        activeCtx: any;
        def: any;
    }): any;
    _getIdForTerm({ term, plural }: {
        term: any;
        plural: any;
    }): any;
    _getTermForId({ id }: {
        id: any;
    }): {
        term: any;
        plural: boolean;
    };
}
/**
 * Fetches a resource given a URL and returns it as a string.
 */
export type documentLoaderFunction = (url: string) => string;
//# sourceMappingURL=Transformer.d.ts.map