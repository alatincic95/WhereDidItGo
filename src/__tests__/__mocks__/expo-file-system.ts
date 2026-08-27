export const File = class {
  uri = 'file://mock';
  constructor() {}
  write() {}
  text() { return ''; }
  static pickFileAsync() { return Promise.resolve(null); }
};
export const Paths = { cache: '/tmp' };
