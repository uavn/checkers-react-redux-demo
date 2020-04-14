import CellBase from './Base/CellBase'

/** @class */
export default class Figure extends CellBase
{
    static WHITE = 'white'
    static BLACK = 'black'

    /** @type {boolean} */
    _isCurrentPlayer

    /** @type {string} */
    _color

    /** @type {boolean} */
    _isQueen = false

    /**
     * @param {number} row 
     * @param {number} col 
     * @param {booleab} isCurrentPlayer 
     * @param {string} color 
     * @param {Object} boardMargins 
     * @param {number} cellSize 
     */
    constructor(row, col, isCurrentPlayer, color, boardMargins, cellSize) {
        super()

        this._row = row
        this._col = col
        this._isCurrentPlayer = isCurrentPlayer
        this._color = color
        this._boardMargins = boardMargins
        this._cellSize = cellSize
        this._position = this._calculatePosition()
    }

    /**
     * @returns {string}
     */
    get color() {
        return this._color
    }

    /**
     * @returns {string}
     */
    get id() {
        return `figure-${this._row}x${this._col}`
    }

    /**
     * @returns {boolean}
     */
    isBlack() {
        return this._color === Figure.BLACK;
    }

    /**
     * @returns {boolean}
     */
    isWhite() {
        return this._color === Figure.WHITE;
    }

    /**
     * @returns {boolean}
     */
    isCurrentPlayer() {
        return this._isCurrentPlayer
    }

    /**
     * @returns {boolean}
     */
    isQueen() {
        return this._isQueen
    }

    /**
     * Upgrades current figure to the queen
     */
    upgradeToQueen() {
        this._isQueen = true
    }
}
