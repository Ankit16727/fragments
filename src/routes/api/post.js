const { Fragment } = require('../../model/fragment');
const crypto = require('crypto');
const logger = require('../../logger');

const generateUUID = () => {
  return crypto.randomUUID().toString('hex');
};

module.exports = async (req, res) => {
  try {
    if (Buffer.isBuffer(req.body) === false) {
      logger.error('Empty request body');
      return res.status(415).json({ error: 'Invalid Content Type' });
    }

    const contentType = req.headers['content-type'];
    const fragment = new Fragment({
      id: generateUUID(),
      ownerId: req.user,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      type: contentType,
      size: Number(req.headers['content-length']),
    });

    await fragment.save();
    await fragment.setData(req.body);

    const apiURL = process.env.API_URL || `${req.protocol}://${req.headers.host}`;
    const location = new URL(`/v1/fragments/${fragment.id}`, apiURL).toString();
    res.setHeader('Location', location);

    logger.info('Fragment created successfully', {
      user: req.user,
      fragmentId: fragment.id,
      type: contentType,
      size: fragment.size,
    });

    res.status(201).json({ status: 'ok', fragment });
  } catch (err) {
    logger.error(`Error creating fragment: ${err.stack}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
