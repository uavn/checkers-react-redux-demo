/** 
 * Base Class for Figure and VacantCell
 * 
 * @class 
 */
export default class CellBase {
    /** @type {number} */
    _row
    
    /** @type {number} */
    _col
    
    /** @type {Object`} */
    _boardMargins
    
    /** @type {number} */
    _cellSize
    
    /** @type {Object} */
    _position
    
    /** @type {boolean} */
    _highlighted = false

    /**
     * Calculates the absolute position on the screen depends from the row and col
     * 
     * @returns {Object}
     */
    _calculatePosition() {
        return {
            left: (this._col * this._cellSize) + this._boardMargins.left,
            top: (this._row * this._cellSize) + this._boardMargins.top
        }
    }

    /**
     * Recalculates position after figure was moved
     */
    reposition() {
        this._position = this._calculatePosition()
        this.unhighlight()
    }

    /**
     * Highlights figure or cell
     */
    highlight() {
        this._highlighted = true
    }

    /**
     * Unhighlight figure or cell
     */
    unhighlight() {
        this._highlighted = false
    }

    /**
     * @returns {boolean}
     */
    isHighlighted() {
        let isHighlighted = this._highlighted

        return isHighlighted
    }

    /**
     * @returns {number}
     */
    get position () {
        return this._position
    }

    /**
     * @param {Object} position
     */
    set position(position) {
        this._position = position
    }

    /**
     * @param {number} row
     */
    set row(row) {
        this._row = row
        this.reposition()
    }

    /**
     * @param {number} col
     */
    set col(col) {
        this._col = col
        this.reposition()
    }

    /**
     * @returns {number}
     */
    get row() {
        return this._row
    }

    /**
     * @returns {number}
     */
    get col() {
        return this._col
    }
}
