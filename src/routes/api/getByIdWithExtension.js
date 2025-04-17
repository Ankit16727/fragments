// src/routes/api/getByIdWithExtension.js
const { Fragment } = require('../../model/fragment');
const { createErrorResponse } = require('../../response');
const logger = require('../../logger');
const csvtojson = require('csvtojson');
const yaml = require('js-yaml');
const markdownit = require('markdown-it');
const striptags = require('striptags');
const removeMarkdown = require('remove-markdown');
const sharp = require('sharp');

const md = new markdownit();

const validConversions = {
  'text/plain': ['.txt'],
  'text/markdown': ['.md', '.html', '.txt'],
  'text/html': ['.html', '.txt'],
  'text/csv': ['.csv', '.txt', '.json'],
  'application/json': ['.json', '.yaml', '.yml', '.txt'],
  'application/yaml': ['.yaml', '.txt'],
  'image/png': ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif'],
  'image/jpeg': ['.png', '.jpg', '.webp', '.gif', '.avif'],
  'image/webp': ['.png', '.jpg', '.webp', '.gif', '.avif'],
  'image/avif': ['.png', '.jpg', '.webp', '.gif', '.avif'],
  'image/gif': ['.png', '.jpg', '.webp', '.gif', '.avif'],
};

const validConversion = (mimeType, ext) => {
  return validConversions[mimeType]?.includes(ext);
};

const imageMimeTypes = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
};

const convertFragmentData = async (mimeType, ext, data) => {
  const stringData = data.toString();

  if (mimeType.startsWith('text/') || mimeType.startsWith('application/')) {
    let convertedData = stringData;
    let contentType = mimeType;

    switch (ext) {
      case '.html':
        if (mimeType === 'text/markdown') {
          convertedData = md.render(stringData);
          contentType = 'text/html';
        }
        break;
      case '.txt':
        contentType = 'text/plain';
        if (mimeType === 'text/html') {
          convertedData = striptags(stringData);
        } else if (mimeType === 'text/markdown') {
          convertedData = removeMarkdown(stringData);
        } else if (mimeType === 'application/json') {
          convertedData = JSON.stringify(JSON.parse(stringData), null, 2);
        } else if (mimeType === 'application/yaml') {
          convertedData = stringData;
        } else {
          convertedData = stringData;
        }
        break;
      case '.json':
        if (mimeType === 'application/json') {
          convertedData = JSON.stringify(JSON.parse(stringData), null, 2);
          contentType = 'application/json';
        } else if (mimeType === 'text/csv') {
          const jsonArray = await csvtojson().fromString(stringData);
          convertedData = JSON.stringify(jsonArray, null, 2);
          contentType = 'application/json';
        }
        break;
      case '.yaml':
      case '.yml':
        if (mimeType === 'application/json') {
          const obj = JSON.parse(stringData);
          convertedData = yaml.dump(obj);
          contentType = 'application/yaml';
        } else if (mimeType === 'application/yaml') {
          convertedData = stringData;
          contentType = 'application/yaml';
        }
        break;
    }

    return { data: convertedData, contentType };
  }

  if (mimeType.startsWith('image/')) {
    const outputFormat = ext.replace('.', '');
    const convertedBuffer = await sharp(data)[outputFormat]().toBuffer();
    const contentType = imageMimeTypes[ext];
    return { data: convertedBuffer, contentType };
  }

  throw new Error('Unsupported type for conversion');
};

module.exports = async (req, res) => {
  const { id, ext } = req.params;
  const extWithDot = `.${ext}`;
  const userHash = req.user;

  try {
    const fragmentIds = await Fragment.byUser(userHash);

    if (!fragmentIds.includes(id)) {
      logger.warn(`Fragment not found: ${id}`);
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }

    const fragmentObject = await Fragment.byId(userHash, id);
    const fragment =
      fragmentObject instanceof Fragment ? fragmentObject : new Fragment(fragmentObject);

    let data = await fragment.getData();
    const originalMimeType = fragment.mimeType;

    if (!validConversion(originalMimeType, extWithDot)) {
      logger.warn(`Invalid conversion for fragment ${id}: ${originalMimeType} to ${extWithDot}`);
      return res
        .status(415)
        .json(createErrorResponse(415, `Cannot convert from ${originalMimeType} to ${extWithDot}`));
    }

    const result = await convertFragmentData(originalMimeType, extWithDot, data);
    res.setHeader('Content-Type', result.contentType);
    res.status(200).send(result.data);
  } catch (err) {
    logger.error('Error processing fragment conversion', { error: err.message });
    res.status(500).json(createErrorResponse(500, 'Internal Server Error'));
  }
};
