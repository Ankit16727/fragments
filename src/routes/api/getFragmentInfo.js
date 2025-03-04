const crypto = require('crypto');
const { Fragment } = require('../../model/fragment');
const { createErrorResponse, createSuccessResponse } = require('../../response');

// Function to validate conversions (currently only supports text/plain -> .txt)
const validConversion = (mimeType, ext) => {
  const validConversions = {
    'text/plain': ['txt'],
  };
  return validConversions[mimeType]?.includes(ext);
};

module.exports = async (req, res) => {
  const idWithExt = req.params.id;
  const userHash = crypto.createHash('sha256').update(req.user).digest('hex');

  // Extract ID and optional extension
  const idParts = idWithExt.split('.');
  const id = idParts.slice(0, -1).join('.') || idParts[0];
  const ext = idParts.length > 1 ? idParts[idParts.length - 1] : null;

  // Fetch user's fragment list
  const fragmentIds = await Fragment.byUser(userHash);

  if (!fragmentIds.includes(id)) {
    return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
  }

  // Retrieve fragment details
  const fragmentObject = await Fragment.byId(userHash, id);
  const fragment =
    fragmentObject instanceof Fragment ? fragmentObject : new Fragment(fragmentObject);

  //let data = await fragment.getData();
  let contentType = fragment.mimeType;

  // Handle optional conversion
  if (ext) {
    if (!validConversion(fragment.mimeType, ext)) {
      return res
        .status(415)
        .json(createErrorResponse(415, `Cannot convert from ${fragment.mimeType} to .${ext}`));
    }
  }

  res.setHeader('Content-Type', contentType);
  res.status(200).json(createSuccessResponse({ fragment: fragment }));
};
