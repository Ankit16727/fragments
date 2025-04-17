const request = require('supertest');
const app = require('../../src/app');
const logger = require('../../src/logger');
const fs = require('fs');
const path = require('path');

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

  test('HTML to plain text conversion', async () => {
    const htmlContent = '<h1>Hello</h1><p>World</p>';
    const resPost = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/html')
      .send(htmlContent);

    const id = resPost.body.fragment.id;
    logger.debug('HTML fragment created for plain text conversion:', id);

    const res = await request(app)
      .get(`/v1/fragments/${id}.txt`)
      .auth('user1@email.com', 'password1');

    logger.info('Converted HTML to plain text');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Hello');
    expect(res.text).toContain('World');
    expect(res.text).not.toContain('<h1>');
  });

  test('JSON to JSON (pretty print) conversion', async () => {
    const jsonData = { language: 'JavaScript', version: 'ES2023' };
    const resPost = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(jsonData));

    const id = resPost.body.fragment.id;
    logger.debug('JSON fragment for pretty print created:', id);

    const res = await request(app)
      .get(`/v1/fragments/${id}.json`)
      .auth('user1@email.com', 'password1');

    logger.info('Returned pretty-printed JSON');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual(jsonData);
  });

  test('CSV to plain text conversion', async () => {
    const csv = 'item,price\nBook,10\nPen,1.5';
    const resPost = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/csv')
      .send(csv);

    const id = resPost.body.fragment.id;
    logger.debug('CSV fragment created for text conversion:', id);

    const res = await request(app)
      .get(`/v1/fragments/${id}.txt`)
      .auth('user1@email.com', 'password1');

    logger.info('Converted CSV to plain text');
    expect(res.status).toBe(200);
    expect(res.text).toContain('item,price');
    expect(res.text).toContain('Book,10');
  });

  test('Markdown to Markdown (.md) return', async () => {
    const md = '# Heading\nSome **bold** text.';
    const resPost = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send(md);

    const id = resPost.body.fragment.id;
    logger.debug('Markdown fragment created for .md return:', id);

    const res = await request(app)
      .get(`/v1/fragments/${id}.md`)
      .auth('user1@email.com', 'password1');

    logger.info('Returned raw markdown from markdown fragment');
    expect(res.status).toBe(200);
    expect(res.text).toContain('# Heading');
    expect(res.headers['content-type']).toMatch(/text\/markdown/);
  });

  test('CSV to CSV (round-trip) return', async () => {
    const csv = 'name,email\nJane,jane@example.com';
    const resPost = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/csv')
      .send(csv);

    const id = resPost.body.fragment.id;
    logger.debug('CSV fragment created for round-trip test:', id);

    const res = await request(app)
      .get(`/v1/fragments/${id}.csv`)
      .auth('user1@email.com', 'password1');

    logger.info('Returned raw CSV from CSV fragment');
    expect(res.status).toBe(200);
    expect(res.text.trim()).toBe(csv);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
  });

  test('Returns 404 for nonexistent fragment ID', async () => {
    const res = await request(app)
      .get('/v1/fragments/nonexistentid123.html')
      .auth('user1@email.com', 'password1');

    expect(res.status).toBe(404);
  });

  test('Upload YAML and convert to text', async () => {
    const yamlContent = `
  name: John
  age: 30
  `;

    const resPost = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/yaml')
      .send(yamlContent);

    const id = resPost.body.fragment.id;

    const res = await request(app)
      .get(`/v1/fragments/${id}.txt`)
      .auth('user1@email.com', 'password1');

    expect(res.status).toBe(200);
    expect(res.text).toContain('name: John');
  });

  test('YAML to YAML (round-trip)', async () => {
    const yamlContent = `
  name: Ankit
  age: 21
    `.trim();

    const resPost = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/yaml')
      .send(yamlContent);

    const id = resPost.body.fragment.id;
    logger.debug('YAML fragment created for round-trip:', id);

    const res = await request(app)
      .get(`/v1/fragments/${id}.yaml`)
      .auth('user1@email.com', 'password1');

    logger.info('Returned YAML as YAML');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/yaml/);
    expect(res.text.trim()).toContain('name: Ankit');
    expect(res.text.trim()).toContain('age: 21');
  });

  test('JSON to YAML conversion', async () => {
    const jsonData = { name: 'Ankit', age: 21 };

    const resPost = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(jsonData));

    const id = resPost.body.fragment.id;
    logger.debug('JSON fragment created for YAML conversion:', id);

    const res = await request(app)
      .get(`/v1/fragments/${id}.yaml`)
      .auth('user1@email.com', 'password1');

    logger.info('Converted JSON to YAML');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/yaml/);
    expect(res.text).toContain('name: Ankit');
    expect(res.text).toContain('age: 21');
  });

  test('Upload PNG and convert to JPEG', async () => {
    // Load a sample PNG file
    const imageBuffer = fs.readFileSync(path.join(__dirname, '../assets/sample.png'));

    // Upload the image
    const resPost = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/png')
      .send(imageBuffer);

    expect(resPost.status).toBe(201);
    const id = resPost.body.fragment.id;

    // Convert to JPEG
    const res = await request(app)
      .get(`/v1/fragments/${id}.jpeg`)
      .auth('user1@email.com', 'password1');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/image\/jpeg/);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
