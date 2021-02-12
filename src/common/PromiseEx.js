/**
 * #HACKED Promise which can be resolved outside of it's context
 */
export default class PromiseEx extends Promise {

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