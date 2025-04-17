const { Fragment } = require('../../model/fragment');
const { createErrorResponse } = require('../../response');
const logger = require('../../logger');

module.exports = async (req, res) => {
  const id = req.params.id;
  const ownerId = req.user;

  try {
    // Check if fragment exists
    const fragmentIds = await Fragment.byUser(ownerId);
    if (!fragmentIds.includes(id)) {
      logger.warn(`PUT failed: Fragment ${id} not found for user ${ownerId}`);
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }

    // Fetch existing fragment
    let fragment = await Fragment.byId(ownerId, id);
    if (!(fragment instanceof Fragment)) {
      fragment = new Fragment(fragment);
    }

    const existingType = fragment.type;
    const newType = req.headers['content-type'];

    // Type mismatch is not allowed
    if (existingType !== newType) {
      logger.warn(`PUT failed: Type mismatch. Existing: ${existingType}, New: ${newType}`);
      return res.status(400).json(createErrorResponse(400, 'Fragment type cannot be changed'));
    }

    // Replace data and update metadata
    fragment.updated = new Date().toISOString();
    fragment.size = Number(req.headers['content-length'] || Buffer.byteLength(req.body));
    await fragment.setData(req.body);
    await fragment.save();

    logger.info(`Fragment ${id} updated successfully`);
    res.status(200).json({ status: 'ok', fragment });
  } catch (err) {
    logger.error(`Error updating fragment ${id}: ${err.stack}`);
    res.status(500).json(createErrorResponse(500, 'Failed to update fragment'));
  }
};
