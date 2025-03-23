const crypto = require('crypto');
const { Fragment } = require('../../model/fragment');
const { createErrorResponse } = require('../../response');

module.exports = async (req, res) => {
  const id = req.params.id;
  const userHash = req.user;

  // Fetch user's fragment list
  const fragmentIds = await Fragment.byUser(userHash);

  if (!fragmentIds.includes(id)) {
    return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
  }

  // Retrieve fragment details
  const fragmentObject = await Fragment.byId(userHash, id);
  const fragment =
    fragmentObject instanceof Fragment ? fragmentObject : new Fragment(fragmentObject);

  const data = await fragment.getData();
  const contentType = fragment.mimeType;

  res.setHeader('Content-Type', contentType);
  res.status(200).send(data);
};
