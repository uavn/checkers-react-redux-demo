/** 
 * Base Observer class
 * 
 * @class 
 */
export default class Observer {
    /** @type {Array} */
    _observers = []

    /**
     * @param {Function} callback 
     */
    subscribe(callback) {
        this._observers.push(callback)
    }

    /**
     * @param {Function} callback 
     */
    unsubscribe(callback) {
        this._observers = this._observers.filter(subscriber => subscriber !== callback)
    }

    /**
     * Remove all subscribers
     */
    unsubscribeAll() {
        this._observers = []
    }

    /**
     * Notify subscribers
     * 
     * @param {Object} action 
     */
    broadcast(action) {
        this._observers.forEach(subscriber => subscriber(action))
    }
}
