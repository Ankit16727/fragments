const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');

module.exports = async (req, res) => {
  const id = req.params.id;
  const user = req.user;

  try {
    const idList = await Fragment.byUser(user);

    if (idList.includes(id)) {
      await Fragment.delete(user, id);
      logger.info(`Fragment ${id} deleted for user ${user}`);

      return res.status(200).json(
        createSuccessResponse({
          message: `fragment ${id} was deleted`,
        })
      );
    } else {
      logger.warn(`Fragment ${id} not found for user ${user}`);

      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }
  } catch (err) {
    logger.error(`Error deleting fragment ${id}: ${err.message}`);

    return res
      .status(500)
      .json(createErrorResponse(500, `Failed to delete fragment ${id}: ${err.message}`));
  }
};
