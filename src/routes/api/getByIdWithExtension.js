const { Fragment } = require('../../model/fragment');
const { createErrorResponse } = require('../../response');
const markdownit = require('markdown-it');
const striptags = require('striptags');
const removeMarkdown = require('remove-markdown');
const logger = require('../../logger'); // Assuming you're using a logger

const md = new markdownit();

const validConversion = (mimeType, ext) => {
  const validConversions = {
    'text/plain': ['.txt'],
    'text/markdown': ['.md', '.html', '.txt'],
    'text/html': ['.html', '.txt'],
    'text/csv': ['.csv', '.txt', '.json'],
    'application/json': ['.json', '.txt'],
  };

  return validConversions[mimeType]?.includes(ext);
};

const convertFragmentData = (mimeType, ext, data) => {
  let convertedData = data;
  let contentType = mimeType;
  const stringData = data.toString();

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
      } else {
        convertedData = stringData;
      }
      break;

    case '.md':
      if (mimeType === 'text/markdown') {
        convertedData = stringData;
        contentType = 'text/markdown';
      }
      break;

    case '.json':
      if (mimeType === 'application/json') {
        convertedData = JSON.stringify(JSON.parse(stringData), null, 2);
        contentType = 'application/json';
      } else if (mimeType === 'text/csv') {
        const csvRows = stringData.split('\n');
        const headers = csvRows[0].split(',');
        const jsonArray = csvRows
          .slice(1)
          .filter(Boolean)
          .map((row) => {
            const values = row.split(',');
            return headers.reduce((obj, header, index) => {
              obj[header.trim()] = values[index]?.trim() ?? '';
              return obj;
            }, {});
          });
        convertedData = JSON.stringify(jsonArray, null, 2);
        contentType = 'application/json';
      }
      break;

    case '.csv':
      if (mimeType === 'text/csv') {
        convertedData = stringData;
        contentType = 'text/csv';
      }
      break;
  }

  return { data: convertedData, contentType };
};

module.exports = async (req, res) => {
  const { id, ext } = req.params;
  const extWithDot = `.${ext}`;
  const userHash = req.user;

  let fragmentIds;
  try {
    fragmentIds = await Fragment.byUser(userHash);
  } catch (err) {
    logger.error('Error fetching fragment list', { userHash, error: err.message });
    return res.status(500).json(createErrorResponse(500, 'Error fetching fragment list'));
  }

  if (!fragmentIds.includes(id)) {
    logger.warn(`Fragment not found: ${id}`);
    return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
  }

  let fragmentObject;
  try {
    fragmentObject = await Fragment.byId(userHash, id);
  } catch (err) {
    logger.error('Error retrieving fragment by ID', { id, error: err.message });
    return res.status(500).json(createErrorResponse(500, 'Failed to retrieve fragment'));
  }

  const fragment =
    fragmentObject instanceof Fragment ? fragmentObject : new Fragment(fragmentObject);

  let data;
  try {
    data = await fragment.getData();
  } catch (err) {
    logger.error('Error getting fragment data', { id, error: err.message });
    return res.status(500).json(createErrorResponse(500, 'Failed to retrieve fragment data'));
  }

  let result;
  try {
    const contentType = fragment.mimeType;

    if (!validConversion(contentType, extWithDot)) {
      logger.warn(
        `Invalid conversion requested for fragment ${id}: ${contentType} to ${extWithDot}`
      );
      return res
        .status(415)
        .json(createErrorResponse(415, `Cannot convert from ${contentType} to ${extWithDot}`));
    }

    result = convertFragmentData(contentType, extWithDot, data);
  } catch (err) {
    logger.error('Error converting fragment data', { id, error: err.message });
    return res.status(500).json(createErrorResponse(500, 'Failed to convert fragment data'));
  }

  try {
    res.setHeader('Content-Type', result.contentType);
    res.status(200).send(result.data);
  } catch (err) {
    logger.error('Error sending response', { id, error: err.message });
    return res.status(500).json(createErrorResponse(500, 'Failed to send response'));
  }
};
