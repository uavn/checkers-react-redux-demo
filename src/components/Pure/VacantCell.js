import CellBase from './Base/CellBase'

/** @class */
export default class VacantCell extends CellBase
{
    _row
    _col
    _boardMargins
    _cellSize
    _position

    /**
     * 
     * @param {number} row 
     * @param {number} col 
     * @param {Object} boardMargins 
     * @param {number} cellSize 
     */
    constructor(row, col, boardMargins, cellSize) {
        super()

        this._row = row
        this._col = col
        this._boardMargins = boardMargins
        this._cellSize = cellSize
        this._position = this._calculatePosition()
    }

    /**
     * @returns {string}
     */
    get id() {
        return `vacant-cell-${this._col}x${this._row}`
    }
}
