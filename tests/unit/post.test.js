const request = require('supertest');
const app = require('../../src/app'); // Your Express app instance
const logger = require('../../src/logger');
require('dotenv').config();

describe('POST /v1/fragments', () => {
  //1. Unauthenticated Request Fails (401)
  test('unauthenticated requests are denied', async () => {
    logger.debug('Sending unauthenticated request to /v1/fragments');
    const response = await request(app).post('/v1/fragments').send('Test Data');
    if (response.status !== 401) {
      logger.error(`Unexpected status code: ${response.status}`);
    }
    expect(response.status).toBe(401);
    logger.info('Unauthenticated request was correctly denied');
  });

  //2. Incorrect Credentials Are Denied
  test('incorrect credentials are denied', async () => {
    logger.debug('Sending request with incorrect credentials');
    const response = await request(app)
      .post('/v1/fragments')
      .auth('invalid@email.com', 'incorrect_password')
      .send('Test Data');
    if (response.status !== 401) {
      logger.error(`Unexpected status code: ${response.status}`);
    }
    expect(response.status).toBe(401);
    logger.info('Request with incorrect credentials was correctly denied');
  });

  // 3. Correct Credentials Are Accepted
  test('correct credentials allow authentication', async () => {
    logger.debug('Sending authenticated request with correct credentials');
    const response = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Valid user test');
    if (response.status !== 201) {
      logger.error(`Unexpected status code: ${response.status}`);
    }
    expect(response.status).toBe(201);
    logger.info('Authenticated request successfully created a fragment');
  });

  // 4. Authenticated users can create fragment
  test('authenticated users can create a fragment', async () => {
    logger.debug('Sending authenticated request to create a fragment');
    const response = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('This is a fragment');
    if (response.status !== 201) {
      logger.error(`Unexpected status code: ${response.status}`);
    }
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('ok');
    expect(response.body.fragment).toMatchObject({
      id: expect.any(String),
      created: expect.any(String),
      updated: expect.any(String),
      ownerId: expect.any(String),
      type: 'text/plain',
      size: 18,
    });
    logger.info('Fragment successfully created');
  });

  // 5. Response Includes Location Header
  test('POST response includes a Location header with a full URL to GET the created fragment', async () => {
    logger.debug('Sending request to check Location header in response');

    const response = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('This is a fragment');

    expect(response.status).toBe(201); // Ensure request was successful

    const fragmentId = response.body.fragment.id;

    // Dynamically determine API URL (fallback to request host if env variable is missing)
    const apiUrl = process.env.API_URL || `${response.request.protocol}//${response.request.host}`;

    const expectedLocation = new URL(`/v1/fragments/${fragmentId}`, apiUrl).href;

    logger.debug(
      `Checking Location header: Expected ${expectedLocation}, Got ${response.headers.location}`
    );

    expect(response.headers.location).toBe(expectedLocation);
    logger.info('Location header is correctly formatted');
  });

  test('trying to create a fragment with an unsupported type errors/logs as expected', async () => {
    logger.debug('Sending request with unsupported content type');
    const response = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/msword')
      .send('Invalid Type');
    if (response.status !== 415) {
      logger.error(`Unexpected status code: ${response.status}`);
    }
    expect(response.status).toBe(415);
    expect(response.body.error).toBe('Invalid Content Type');
    logger.warn('Unsupported content type correctly rejected');
  });
});
