const request = require('supertest');
const app = require('../../src/app');
const logger = require('../../src/logger');

describe('GET /v1/fragments/:id.ext - with conversion', () => {
  test('Check validConversion() pass', async () => {
    const resPost = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('fragment');

    const id = resPost.body.fragment.id;
    logger.debug('Created fragment ID:', id);

    const res = await request(app)
      .get(`/v1/fragments/${id}.txt`)
      .auth('user1@email.com', 'password1');

    logger.info('Response:', res.status, res.headers['content-type']);
    expect(res.status).toBe(200);
  });

  test('Check validConversion() fail', async () => {
    const resPost = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('fragment');

    const id = resPost.body.fragment.id;
    logger.debug('Created fragment ID for invalid test:', id);

    const res = await request(app)
      .get(`/v1/fragments/${id}.png`)
      .auth('user1@email.com', 'password1');

    logger.warn(`Expected failure for unsupported conversion. Status: ${res.status}`);
    expect(res.status).toBe(415);
  });

  test('Markdown to HTML conversion', async () => {
    const markdown = '# Hello World';
    const resPost = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send(markdown);

    const id = resPost.body.fragment.id;
    logger.debug('Created markdown fragment ID:', id);

    const res = await request(app)
      .get(`/v1/fragments/${id}.html`)
      .auth('user1@email.com', 'password1');

    logger.info(`Converted markdown to HTML. Content-Type: ${res.headers['content-type']}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('<h1');
  });

  test('Markdown to plain text conversion', async () => {
    const markdown = '# Hello World\nThis is **bold**.';
    const resPost = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send(markdown);

    const id = resPost.body.fragment.id;
    logger.debug('Markdown fragment for plain text conversion:', id);

    const res = await request(app)
      .get(`/v1/fragments/${id}.txt`)
      .auth('user1@email.com', 'password1');

    logger.info('Converted markdown to plain text.');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.text).toContain('Hello World');
    expect(res.text).not.toContain('#');
  });

  test('JSON to pretty text conversion', async () => {
    const jsonData = { name: 'Alice', age: 30 };
    const resPost = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(jsonData));

    const id = resPost.body.fragment.id;
    logger.debug('JSON fragment created with ID:', id);

    const res = await request(app)
      .get(`/v1/fragments/${id}.txt`)
      .auth('user1@email.com', 'password1');

    logger.info('Converted JSON to text');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.text).toContain('"name": "Alice"');
  });

  test('CSV to JSON conversion', async () => {
    const csv = 'name,age\nAlice,30\nBob,25';
    const resPost = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/csv')
      .send(csv);

    const id = resPost.body.fragment.id;
    logger.debug('CSV fragment created with ID:', id);

    const res = await request(app)
      .get(`/v1/fragments/${id}.json`)
      .auth('user1@email.com', 'password1');

    logger.info('Converted CSV to JSON:', res.body);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual([
      { name: 'Alice', age: '30' },
      { name: 'Bob', age: '25' },
    ]);
  });
});
