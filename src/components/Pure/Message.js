/** @class */
export default class Message 
{
    /**
     * @param {string} text 
     */
    constructor(text) {
        this.text = text
        this.time = new Date()
    }

    /**
     * @returns {string}
     */
    get id() {
        // Random unique key
        return Math.random().toString(36).substr(2, 9)
    }
}
