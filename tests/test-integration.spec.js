/*!
 * Copyright (c) 2020-2021 Digital Bazaar, Inc. All rights reserved.
 */
import * as jsonld from "jsonld";
import { readdirSync, readFileSync } from "fs";
import { default as path } from "path";
import { default as chai, expect } from "chai";
import { default as chaiBytes } from "chai-bytes";
import { default as chaiAsPromised } from "chai-as-promised";
chai.use(chaiBytes);
chai.use(chaiAsPromised);
global.should = chai.should();

import { encode } from "../lib/encode";
import { decode } from "../lib/decode";

describe("integration", () => {
  // Returns the list of "*.jsonld" files in the given directory.
  const listJsonLdFiles = (dirPath) => {
    const absolutePath = path.resolve(__dirname, dirPath);
    return readdirSync(absolutePath, { withFileTypes: true })
      .filter((dirent) => dirent.isFile() && dirent.name.endsWith(".jsonld"))
      .map((dirent) => ({
        fileName: dirent.name,
        location: path.resolve(absolutePath, dirent.name),
      }));
  };

  // Returns the JSON-LD document at the given location.
  const readJsonLdFile = (filePath) => {
    try {
      const absolutePath = path.resolve(__dirname, filePath);
      const input = readFileSync(absolutePath, { encoding: "utf8" });
      return JSON.parse(input);
    } catch (err) {
      throw new Error(`Failed to read JSON-LD document at ${filePath}: ${err}`);
    }
  };

  const cache = new Map();
  const documentLoader = async (url) => {
    if (cache.has(url)) {
      return cache.get(url);
    }
    const document = await jsonld.get(url, {});
    cache.set(url, document);
    return document;
  };

  const buildTestCase = ({ fileName, location }) => {
    it(`should round trip with "${fileName}"`, async () => {
      const jsonldDocument = readJsonLdFile(location);
      const allowUndefinedTerms = true;

      const cborldBytes = await encode({
        jsonldDocument,
        documentLoader,
        allowUndefinedTerms,
      });

      const decodedDocument = await decode({
        cborldBytes,
        documentLoader,
        allowUndefinedTerms,
      });

      expect(decodedDocument).to.eql(jsonldDocument);
    });
  };

  describe("with basic inputs", () => {
    listJsonLdFiles("./data").forEach(buildTestCase);
  });

  describe("with vc-test-suite inputs", () => {
    listJsonLdFiles("./data/vc-test-suite").forEach(buildTestCase);
  });
});
