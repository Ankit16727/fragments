const { Fragment } = require('../../model/fragment');
const { createErrorResponse } = require('../../response');
const logger = require('../../logger');

module.exports = async (req, res) => {
  const id = req.params.id;
  const userHash = req.user;

  let fragmentIds;
  try {
    fragmentIds = await Fragment.byUser(userHash);
  } catch (err) {
    logger.error('Failed to fetch fragment list for user', { userHash, error: err.message });
    return res.status(500).json(createErrorResponse(500, 'Failed to fetch fragment list'));
  }

  if (!fragmentIds.includes(id)) {
    logger.warn(`Fragment not found: ${id}`);
    return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
  }

  let fragmentObject;
  try {
    fragmentObject = await Fragment.byId(userHash, id);
  } catch (err) {
    logger.error('Failed to retrieve fragment by ID', { id, userHash, error: err.message });
    return res.status(500).json(createErrorResponse(500, 'Failed to retrieve fragment'));
  }

  const fragment =
    fragmentObject instanceof Fragment ? fragmentObject : new Fragment(fragmentObject);

  let data;
  try {
    data = await fragment.getData();
  } catch (err) {
    logger.error('Failed to get fragment data', { id, error: err.message });
    return res.status(500).json(createErrorResponse(500, 'Failed to retrieve fragment data'));
  }

  try {
    const contentType = fragment.mimeType;
    logger.info(`Successfully retrieved fragment ${id}`, { contentType });
    res.setHeader('Content-Type', contentType);
    res.status(200).send(data);
  } catch (err) {
    logger.error('Failed to send response for fragment', { id, error: err.message });
    return res.status(500).json(createErrorResponse(500, 'Failed to send fragment response'));
  }
};
