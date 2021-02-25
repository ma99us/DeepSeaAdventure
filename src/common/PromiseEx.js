/**
 * "Enhanced" Promise, which can be resolved outside of it's context. And has internal 'name' and 'state'
 */
export default class PromiseEx extends Promise {
  // All possible States a Promise could have
  static State = {ACTIVE: 'active', RESOLVED: 'resolved', REJECTED: 'rejected'};

  /**
   * @param func callback function to access 'resolve', 'reject'  methods (like in regular Promise).
   * Or a string Name for this Promise.
   */
  constructor(func) {
    let onResolve;
    let onReject;
    super((resolve, reject) => {
      onResolve = resolve;
      onReject = reject;
      if (func instanceof Function) {
        func(resolve, reject);
      }
    });
    //FIXME: 'this' is unavailable before this point? Can this be done better, without the temp variables?
    this.onResolve = onResolve;
    this.onReject = onReject;

    if (typeof func === 'string') {
      this.name = func;
    }

    this.state = PromiseEx.State.ACTIVE;
    this.then((value) => {
      this.state = PromiseEx.State.RESOLVED;
      return value;
    });
    this.catch((err) => {
      this.state = PromiseEx.State.REJECTED;
      throw err;
    });
  }

  /**
   * Checks if this Promise was already Resolved or Rejected.
   * @returns {boolean}
   */
  get isDone() {
    return this.state !== PromiseEx.State.ACTIVE;
  }

  // Use Symbol.species to return a Promise for then/catch/finally
  static get [Symbol.species]() {
    return Promise;
  }

  // Overrides Promise Symbol.toStringTag
  get [Symbol.toStringTag]() {
    return 'PromiseEx';
  }
}

/**
 * Collection of named Promises or groups of named Promises.
 */
export class PromiseExState {

  /**
   * @param funk callback function to execute on every update of the each promises group (optional).
   */
  constructor(funk) {
    this.promises = {};
    this.funk = funk;
  }

  /**
   * Create a named Promise or a group of Promises.
   * @param keys name or an array of keys names for each Promise in a group.
   * @returns {Promise<[PromiseEx , any]>} wrapper promise, which resolves when all promises in the group resolve.
   */
  promise(...keys) {
    const pArr = keys.map(key => {
      const p = new PromiseEx(key);
      this.promises[key] = p;
      return p;
    });

    const pAll = Promise.all(pArr);
    pAll.finally(() => {
      // call-back after Promise resolution
      if (this.funk) {
        this.funk(this.state);
      }
    });

    if (this.funk) {
      // call-back before Promise resolution
      this.funk(this.state);
    }

    return pAll;
  }

  /**
   * @param key promise name
   * @returns {null} a 'resolve' function of the named promise if it is still active, null otherwise.
   */
  resolve(key) {
    const p = this.promises[key];
    return (p && !p.isDone) ? p.onResolve : null; // can be resolved/rejected only once!
  }

  /**
   * @param key promise name
   * @returns {null} a 'reject' function of the named promise if it is still active, null otherwise.
   */
  reject(key) {
    const p = this.promises[key];
    return (p && !p.isDone) ? p.onReject : null;  // can be resolved/rejected only once!
  }

  /**
   * Removes promise from collection. Only resolved or rejected (done) promises can be removed.
   * @param keys promise name or array of promises names to remove
   */
  remove(...keys) {
    keys.forEach((key) => {
      delete this.promises[key];
    });
  }

  /**
   * Removes all resolved promises from collection.
   */
  clean() {
    const doneKeys = Object.keys(this.promises).filter((key) => {
      const p = this.promises[key];
      return p != null && p.isDone;
    });

    this.remove(...doneKeys);
  }

  /**
   * Checks if all named promises were resolved or rejected
   * @param keys key name or an array of keys names for each Promise in a group.
   * @returns {boolean} true - if all Promises were rejected or resolved, (none are active, or do not exist). false if at least one Promise is still active.
   */
  isDone(...keys) {
    const doneKeys = keys.filter((key) => {
      const p = this.promises[key];
      return p != null && p.isDone;
    });

    return keys.length === doneKeys.length; // all keys are 'Done'
  }

  /**
   * Simple object representing all Promises states in the collection.
   */
  get state() {
    const s = {};
    for (const [key, p] of Object.entries(this.promises)) {
      s[key] = p.state;
    }
    return s;
  }
}