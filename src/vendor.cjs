'use strict';
const JSZip = require('jszip');
const {renderAsync,parseAsync,renderDocument} = require('../node_modules/docx-preview/dist/docx-preview.js');
const OleExtractor = require('word-extractor/lib/word-ole-extractor');
const BufferReader = require('word-extractor/lib/buffer-reader');
const {Buffer} = require('buffer');
const rtf = require('rtf-parser');
window.FDeps = {
  JSZip, renderAsync, parseAsync, renderDocument,
  parseRTF: text => new Promise((resolve,reject) => rtf.string(text,(error,document)=>error?reject(error):resolve(document))),
  extractDoc: async data => {
    const reader = new BufferReader(Buffer.from(data));
    await reader.open();
    try {return await new OleExtractor().extract(reader);} finally {await reader.close();}
  }
};
