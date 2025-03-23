const { Fragment } = require('../../model/fragment');
const { createErrorResponse } = require('../../response');
const markdownit = require('markdown-it');
const striptags = require('striptags');
const removeMarkdown = require('remove-markdown');

const md = new markdownit();
// Function to validate conversions for text-based fragments
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

// Function to handle conversions
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

  // Fetch user's fragment list
  const fragmentIds = await Fragment.byUser(userHash);

  if (!fragmentIds.includes(id)) {
    return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
  }

  const fragmentObject = await Fragment.byId(userHash, id);
  const fragment =
    fragmentObject instanceof Fragment ? fragmentObject : new Fragment(fragmentObject);

  let data = await fragment.getData();
  let contentType = fragment.mimeType;

  if (!validConversion(contentType, extWithDot)) {
    return res
      .status(415)
      .json(createErrorResponse(415, `Cannot convert from ${contentType} to ${extWithDot}`));
  }

  const result = convertFragmentData(contentType, extWithDot, data);
  data = result.data;
  contentType = result.contentType;

  res.setHeader('Content-Type', contentType);
  res.status(200).send(data);
};
