// Meta.js
class Meta {
  constructor() {
    this.state = {};
  }

  set(key, value) {
    this.state[key] = value;
  }

  get(key) {
    return this.state[key];
  }
}

const MetaProxy = new Proxy(new Meta(), {
  get(target, prop) {
    if (prop in target.state) {
      return target.state[prop];
    }
    return target[prop];
  },
  set(target, prop, value) {
    if (prop in target.state) {
      target.state[prop] = value;
    } else {
      target[prop] = value;
    }
    return true;
  },
});

export default MetaProxy;
