const { Fragment } = require('../../model/fragment');
const { createErrorResponse, createSuccessResponse } = require('../../response');

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

  res.status(200).json(createSuccessResponse({ fragment: fragment }));
};
