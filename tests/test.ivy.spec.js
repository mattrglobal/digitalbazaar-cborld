/*!
 * Copyright (c) 2020-2021 Digital Bazaar, Inc. All rights reserved.
 */
import {default as chai, expect} from 'chai';
import {default as chaiBytes} from 'chai-bytes';
chai.use(chaiBytes);
global.should = chai.should();

import {encode} from '..';
import {
  contexts,
  SCHEMA_ORG,
  CREDENTIALS_V1,
  CREDENTIALS_EXAMPLES_V1,
} from './context';
import vcUndefinedTerms from './data/vc.undefinedTerms.json';
import vcMixedContexts from './data/vc.mixedContexts.json';

describe('cborld ivy', () => {
  const documentLoader = url => {
    if(url && contexts[url]) {
      return {
        contextUrl: null,
        document: contexts[url],
        documentUrl: url,
      };
    }
    throw new Error(`Refused to load URL "${url}".`);
  };

  const toHexString = byteArray => {
    return Array.from(byteArray, function(byte) {
      return ('0' + (byte & 0xff).toString(16)).slice(-2);
    }).join('');
  };
  describe('encode', () => {
    it.only('should encode when has mixed contexts', async () => {
      const appContextMap = new Map([
        [CREDENTIALS_V1, 0x8000],
        [CREDENTIALS_EXAMPLES_V1, 0x9000],
      ]);
      const cborldBytes = await encode({
        jsonldDocument: vcMixedContexts,
        documentLoader,
        appContextMap,
      });
      console.log('cborldBytes: ', toHexString(cborldBytes));
      // eslint-disable-next-line max-len
      expect(cborldBytes).equalBytes('d90501a60182111990001872a5187418681902381a60c7dc2b19023e789065794a68624763694f694a465a45525451534973496d49324e4349365a6d467363325573496d4e79615851694f6c7369596a5930496c31392e2e57783658577354453073553045357532497230646f56594d35614f7074445951736a5778716b5f6d3934685875326144797733494b774e437a584b6e616c766737414874464d72342d73397a6c735037765731674151190242190248190246831904015822ed0179a460c203af46de5205c2f32600a34f347affca2f211db33f211d63806f47385822ed0179a460c203af46de5205c2f32600a34f347affca2f211db33f211d63806f4738187581186c19021ea11870821904015822ed01d542b75dd65238b27d08753faf59dfab68d54a5da21b85e828806295ac4aab52190226821a60c7dc2b183919022aa21870821904015822ed0179a460c203af46de5205c2f32600a34f347affca2f211db33f211d63806f47381902046774657374696e67');
    });

    it('should encode when has undefined terms', async () => {
      const appContextMap = new Map([
        [CREDENTIALS_V1, 0x8000],
        [SCHEMA_ORG, 0x9000],
      ]);
      const cborldBytes = await encode({
        jsonldDocument: vcUndefinedTerms,
        documentLoader,
        appContextMap,
      });
      expect(cborldBytes).equalBytes('d90501a20019800018661a6070bb5f');
    });
  });
});
