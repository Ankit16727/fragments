// Use crypto.randomUUID() to create unique IDs, see:
// https://nodejs.org/api/crypto.html#cryptorandomuuidoptions
const { randomUUID } = require('crypto');
// Use https://www.npmjs.com/package/content-type to create/parse Content-Type headers
const contentType = require('content-type');

// Functions for working with fragment metadata/data using our DB
const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
} = require('./data');

class Fragment {
  constructor({ id, ownerId, created, updated, type, size }) {
    if (!ownerId || !type) {
      throw new Error('ownerId and type are required');
    }
    size = !isNaN(size) ? size : 0;
    if (typeof size !== 'number' || size < 0 || isNaN(size)) {
      throw new Error('size must be a non-negative number');
    }

    if (!Fragment.isSupportedType(type)) {
      throw new Error(`Unsupported fragment type: ${type}`);
    }

    this.id = id || randomUUID();
    this.ownerId = ownerId;
    this.created = created || new Date().toISOString();
    this.updated = updated || this.created;
    this.type = type;
    this.size = size || 0;
  }

  static async byUser(ownerId, expand = false) {
    const fragments = await listFragments(ownerId, expand);
    return expand ? fragments.map((fragment) => new Fragment(fragment)) : fragments;
  }

  static async byId(ownerId, id) {
    const fragment = await readFragment(ownerId, id);
    if (!fragment) {
      throw new Error(`Fragment with id ${id} not found`);
    }
    return new Fragment(fragment);
  }

  static async delete(ownerId, id) {
    await deleteFragment(ownerId, id);
  }

  async save() {
    this.updated = new Date().toISOString();
    await writeFragment(this);
  }

  async getData() {
    return readFragmentData(this.ownerId, this.id);
  }

  async setData(data) {
    if (!(data instanceof Buffer)) {
      throw new Error('Data must be a Buffer');
    }
    this.size = data.length;
    this.updated = new Date().toISOString();
    await writeFragmentData(this.ownerId, this.id, data);
    await this.save();
  }

  get mimeType() {
    return contentType.parse(this.type).type;
  }

  get isText() {
    return this.mimeType.startsWith('text/');
  }

  get formats() {
    const formatMap = {
      'text/plain': ['text/plain'],
      'text/html': ['text/html', 'text/plain'],
      'application/json': ['application/json', 'text/plain'],
    };
    return formatMap[this.mimeType] ? formatMap[this.mimeType] : [];
  }

  static isSupportedType(value) {
    try {
      const { type } = contentType.parse(value);
      return ['text/plain', 'text/html', 'text/markdown', 'text/csv', 'application/json'].includes(
        type
      );
    } catch {
      return false;
    }
  }
}

module.exports.Fragment = Fragment;
