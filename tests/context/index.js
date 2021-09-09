/* eslint-disable max-len */
import schemaOrg from './schemaOrg.json';
import credentialV1 from './credentials.v1.json';
import credentialExampleV1 from './credentials.example.v1.json';
import nsOdrl from './nsOdrl.json';

export const SCHEMA_ORG = 'https://schema.org';
export const CREDENTIALS_V1 = 'https://www.w3.org/2018/credentials/v1';
export const CREDENTIALS_EXAMPLES_V1 =
  'https://www.w3.org/2018/credentials/examples/v1';
export const NS_ODRL = 'https://www.w3.org/ns/odrl.jsonld';

export const contexts = {
  [SCHEMA_ORG]: schemaOrg,
  [CREDENTIALS_V1]: credentialV1,
  [CREDENTIALS_EXAMPLES_V1]: credentialExampleV1,
  [NS_ODRL]: nsOdrl
};
