// src/routes/api/get.js
const { createSuccessResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');

/**
 * Get a list of fragments for the current user
 */
module.exports = async (req, res) => {
  const expand = req.query.expand == 1 ? true : false;
  let user = req.user;
  const data = await Fragment.byUser(user, expand);

  const response = createSuccessResponse({ fragments: data });
  // TODO: this is just a placeholder. To get something working, return an empty array...
  res.status(200).json(response);
};
