import Figure from "./Figure"
import VacantCell from "./VacantCell"
import Observer from './Base/Observer'

/** @class */
export default class Board  extends Observer
{
    // Board size
    static BOARD_SIZE = 8

    // Actions
    static ACTION_MESSAGE = 'ACTION_MESSAGE'
    static ACTION_INIT = 'ACTION_INIT'
    static ACTION_STEP = 'ACTION_STEP'
    static ACTION_I_MADE_A_STEP = 'ACTION_I_MADE_A_STEP'
    static ACTION_GAME_OVER = 'ACTION_GAME_OVER'
    static ACTION_MESSAGE_YOU_SHOULD_FIGHT_WITH_THIS_FIGURE = 'ACTION_MESSAGE_YOU_SHOULD_FIGHT_WITH_THIS_FIGURE'
    static ACTION_MESSAGE_THIS_IS_NOT_YOUR_FIGURE = 'ACTION_MESSAGE_THIS_IS_NOT_YOUR_FIGURE'
    static ACTION_MESSAGE_YOU_SHOULD_BEAT = 'ACTION_MESSAGE_YOU_SHOULD_BEAT'
    static ACTION_MESSAGE_YOU_CANT_GO_HERE = 'ACTION_MESSAGE_YOU_CANT_GO_HERE'
    static ACTION_MESSAGE_THIS_IS_NOT_YOUR_STEP = 'ACTION_MESSAGE_THIS_IS_NOT_YOUR_STEP'
    static ACTION_MESSAGE_GO_BLACK = 'ACTION_MESSAGE_GO_BLACK'
    static ACTION_MESSAGE_GO_WHITE = 'ACTION_MESSAGE_GO_WHITE'
    static ACTION_MESSAGE_HEY_GO_BEAT_SOMEONE_MORE = 'ACTION_MESSAGE_HEY_GO_BEAT_SOMEONE_MORE'

    /** @type {number} */
    _rowsCount = (Board.BOARD_SIZE - 2) / 2
    
    /** @type {boolean} */
    _amIPlayWhite = true
    
    /** @type {number} */
    _cellSize = 30
    
    /** @type {Object} */
    _boardMargins = {
        top: 0,
        left: 0
    }
    
    /** @type {Object} */
    _cells = {}
    
    /** @type {Array} */
    _deadFigures = []
    
    /** @type {string} */
    _whoseMove = Figure.WHITE
    
    /** @type {boolean} */
    _localGame = false

    /** @type {Array} */
    _map = []

    /**
     * @param {Object} params 
     */
    constructor({amIPlayWhite, localGame, boardMargins, cellSize, map}) {
        super()

        this._amIPlayWhite = amIPlayWhite
        this._boardMargins = boardMargins
        this._cellSize = cellSize
        this._localGame = localGame
        this._map = map
    }

    init() {
        if (this._localGame && this._map && this._map.length) {
            // Init board from map
            for (let row = 0; row < Board.BOARD_SIZE; row++) {
                for (let col = 0; col < Board.BOARD_SIZE; col++) {
                    if (!this._isWhiteCell(row, col)) {
                        let mapVal = this._map[row].replace(/\s/g, '').split('')[col]
    
                        let cell = null
                        
                        if (mapVal === '+') {
                            cell = this._createVacantCell(row, col)
                        } else if (mapVal === 'w') {
                            cell = this._createFigure(row, col, true, Figure.WHITE)
                        } else if (mapVal === 'W') {
                            cell = this._createFigure(row, col, true, Figure.WHITE)
                            cell.upgradeToQueen()
                        } else if (mapVal === 'b') {
                            cell = this._createFigure(row, col, false, Figure.BLACK)
                        } else if (mapVal === 'B') {
                            cell = this._createFigure(row, col, false, Figure.BLACK)
                            cell.upgradeToQueen()
                        }
    
                        if (!this._cells[row]) this._cells[row] = {}
                        this._cells[row][col] = cell
                    }
                }
            }
        } else {
            // Default init
            for (let row = 0; row < Board.BOARD_SIZE; row++) {
                for (let col = 0; col < Board.BOARD_SIZE; col++) {
                    if (!this._isWhiteCell(row, col)) {
                        let cell = this._initCell(row, col)
                        
                        if (!this._cells[row]) this._cells[row] = {}
                        this._cells[row][col] = cell.figure || cell.vacantCell
                    }
                }
            }
        }

        this.broadcast({
            type: Board.ACTION_INIT,
            payload: this._cells
        })
    }

    /**
     * Check if figure is allowed to be moved to the cell
     * 
     * @param {Figure} figure 
     * @param {VacantCell} vacantCell 
     */
    canThisStepBeDone(figure, vacantCell) {
        if (!figure.isCurrentPlayer() && !this._localGame) {
            // If player wants to make a step by enemy figure - he can't
            this.broadcast({
                type: Board.ACTION_MESSAGE_THIS_IS_NOT_YOUR_FIGURE,
            })

            return false
        }

        if (figure.color !== this._whoseMove) {
            // If player wants to make a step by enemy figure - he can't
            this.broadcast({
                type: Board.ACTION_MESSAGE_THIS_IS_NOT_YOUR_STEP,
            })

            return false
        }

        // If there are figures that should fight - allow only those figures
        let figuresThatShouldFight = this._getFiguresThatShouldFight(figure)

        // If there is a figure, that should fight, and it is not the current figure - step denied
        if (figuresThatShouldFight.length && !figuresThatShouldFight.includes(figure)) {
            this.broadcast({
                type: Board.ACTION_MESSAGE_YOU_SHOULD_FIGHT_WITH_THIS_FIGURE,
                payload: figuresThatShouldFight
            })
            
            return false
        }

        // Check for enemies around - if found - should be beaten
        let enemies = this._getEnemiesThatCanBeBeatenByFigure(figure)

        let theOnlyPossibleSteps = []

        for (let enemy of enemies) {
            let directions = this._getVacantCellsAfterEnemy(figure, enemy)

            if (directions.length) {
                theOnlyPossibleSteps = theOnlyPossibleSteps.concat(directions)
            }
        }

        // Rescrict steps to one of the list if any
        if (theOnlyPossibleSteps.length) {
            for (let possibleCell of theOnlyPossibleSteps) {
                if (possibleCell.row === vacantCell.row && possibleCell.col === vacantCell.col) {
                    // If there is enemy nearby and player beats it - it is allowed
                    return true
                }
            }

            this.broadcast({
                type: Board.ACTION_MESSAGE_YOU_SHOULD_BEAT,
                payload: theOnlyPossibleSteps
            })

            // Otherwise it is not
            return false
        }

        if (this._isCellAvailableForTheFigure(figure, vacantCell)) {
            return true
        }

        this.broadcast({
            type: Board.ACTION_MESSAGE_YOU_CANT_GO_HERE,
        })

        return false
    }

    /**
     * Move figure to the cell if it is possible
     * 
     * @param {Figure} figure 
     * @param {VacantCell} vacantCell 
     */
    moveFigureItIsPossible(figure, vacantCell) {
        if (this.canThisStepBeDone(figure, vacantCell)) {
            this.moveFigure(figure, vacantCell)
        }
    }

    /**
     * Move figure to the cell
     * 
     * @param {Figure} figure 
     * @param {VacantCell} vacantCell 
     */
    moveFigure(figure, vacantCell) {
        let stepShortInfo = {
            color: figure.color,

            from: {
                row: figure.row,
                col: figure.col
            },

            to: {
                row: vacantCell.row,
                col: vacantCell.col
            }
        };

        let cells = this._getCellsBetweenTwo(figure, vacantCell)

        for (let enemy of cells) {
            if (enemy && enemy instanceof Figure && enemy.color !== figure.color) {
                // Beat enemy if any
                this._deadFigures.push(this._cells[enemy.row][enemy.col])
            }
        }

        this.broadcast({
            type: Board.ACTION_MESSAGE,
            payload: (
                figure.color + ': ' +
                this._convertColToChar(figure.col) + this._convertRowToNumber(figure.row) +
                (this._deadFigures.length ? ':' : '') +
                this._convertColToChar(vacantCell.col) + this._convertRowToNumber(vacantCell.row)
            )
        })

        let figureRow = figure.row
        let figureCol = figure.col

        // Re-index
        this._cells[figure.row][figure.col] = vacantCell
        this._cells[vacantCell.row][vacantCell.col] = figure

        figure.row = vacantCell.row
        figure.col = vacantCell.col

        vacantCell.row = figureRow
        vacantCell.col = figureCol

        // Black figure is queen now
        if (figure.isBlack() && figure.row === Board.BOARD_SIZE - 1) {
            figure.upgradeToQueen()
        }

        // White figure is queen now
        if (figure.isWhite() && figure.row === 0) {
            figure.upgradeToQueen()
        }

        // If there are no more moves - change player, or if player beat the enemy and there are some more - player should continue his fight
        if (this._deadFigures.length && this._getEnemiesThatCanBeBeatenByFigure(figure).length) {
            this.broadcast({
                type: Board.ACTION_MESSAGE_HEY_GO_BEAT_SOMEONE_MORE,
            })
        } else {
            if (Figure.WHITE === this._whoseMove) {
                this._whoseMove = Figure.BLACK

                this.broadcast({
                    type: Board.ACTION_MESSAGE_GO_BLACK,
                })
            } else {
                this._whoseMove = Figure.WHITE

                this.broadcast({
                    type: Board.ACTION_MESSAGE_GO_WHITE,
                })
            }

            this._removeDeadFiguresFromTheBoard()
            this._checkIfSomebodyWins()
        }

        this.broadcast({
            type: Board.ACTION_STEP,
            payload: this._cells
        })

        if (figure.isCurrentPlayer()) {   
            this.broadcast({
                type: Board.ACTION_I_MADE_A_STEP,
                payload: stepShortInfo
            })
        }
    }

    /**
     * Move figure to the cell by its coordinates
     * 
     * @param {Object} from 
     * @param {Object} to 
     */
    makeStep(from, to) {
        // if (!from.row || !from.col || !to.row || !to.col) {
        //     return
        // }
        
        let figure = this._cells[from.row][from.col]
        let vacantCell = this._cells[to.row][to.col]

        if (figure instanceof Figure && vacantCell instanceof VacantCell) {
            return this.moveFigure(figure, vacantCell)
        }

        return
    }

    /**
     * @returns {string}
     */
    getMyColor() {
        return this._amIPlayWhite ? Figure.WHITE : Figure.BLACK
    }

    /**
     * @param {Object} cell1 
     * @param {Object} cell2
     * 
     * @returns {Array} 
     */
    _getCellsBetweenTwo(cell1, cell2) {
        let cells = []

        let steps = Math.abs(cell2.row - cell1.row) - 1
        let rowSign = Math.sign(cell2.row - cell1.row)
        let colSign = Math.sign(cell2.col - cell1.col)

        for (let i = 1; i <= steps; i++) {
            let row = cell1.row + i * rowSign
            let col = cell1.col + i * colSign

            if (!this._isWhiteCell(row, col)) {
                cells.push(this._cells[row][col])
            }
        }

        return cells
    }

    /**
     * @param {Figure} figure
     * @param {VacantCell} vacantCell
     * 
     * @returns {boolean}
     */
    _canCellBeJumpedTo(figure, vacantCell) {
        // Regular mode
        let cells = this._getCellsBetweenTwo(figure, vacantCell)

        if (!figure.isQueen()) {
            if (cells.length === 1) {
                let cellBetween = cells[0];

                if (cellBetween instanceof Figure && cellBetween.color !== figure.color) {
                    // Regular fight step
                    return true
                }
            } else if (cells.length === 0) {
                // Regular step
                for (let possibleCol of [figure.col + 1, figure.col - 1]) {
                    // White can go up, black can go down
                    let possibleRow = figure.row + (figure.isBlack() ? 1 : - 1)
                    
                    if (vacantCell.col === possibleCol && vacantCell.row === possibleRow) {
                        // If player want's to go to one of the two vacant black cells nearby - he can
                        return true
                    }
                }
            }

            return false
        }

        // Queen mode
        let previousFigure = null

        for (let cell of cells) {
            if (this._deadFigures.includes(cell)) {
                // If dead gigure is on the way - can't jump
                return false
            }

            if (cell instanceof Figure && cell.color === figure.color) {
                // If we found our figure on our way - we can't go further
                return false
            }

            if (previousFigure && (cell instanceof Figure)) {
                // If two figures in a row - we can't jump
                return false
            }

            previousFigure = (cell instanceof Figure) ? cell : null
        }

        return true
    }

    /**
     * @param {Figure} figure 
     * @param {VacantCell} vacantCell 
     * 
     * @returns {boolean}
     */
    _isCellAvailableForTheFigure(figure, vacantCell) {
        if (this._canCellBeJumpedTo(figure, vacantCell)) {
            // If cell is on same diag as figure - allow, otherwise - not
            let k = Math.abs((figure.row * 10 + figure.col) - (vacantCell.row * 10 + vacantCell.col))

            return (0 === (k % 11)) || (0 === (k % 9))
        }

        return false
    }

    /**
     * @param {Figure} figure 
     * 
     * @returns {Array}
     */
    _getFiguresThatShouldFight(figure) {
        let figuresThatShouldFight = []
        let sameTeamFigures = this._getTeamFigures(figure.color)
        
        for (let myFigure of sameTeamFigures) {
            if (this._getEnemiesThatCanBeBeatenByFigure(myFigure).length) {
                figuresThatShouldFight.push(myFigure)
            }
        }

        return figuresThatShouldFight
    }

    /**
     * @param {Figure} figure 
     * @param {Figure} enemy 
     * 
     * @returns {Array}
     */
    _getVacantCellsAfterEnemy(figure, enemy) {
        let rowStep = Math.sign(enemy.row - figure.row)
        let colStep = Math.sign(enemy.col - figure.col)

        let endRow
        let endCol

        if (figure.isQueen()) {
            endRow = (rowStep > 0 ? (Board.BOARD_SIZE - 1) : 0)
            endCol = (colStep > 0 ? (Board.BOARD_SIZE - 1) : 0)
        } else {
            endRow = enemy.row + rowStep
            endCol = enemy.col + colStep
        }

        let col = enemy.col + colStep
        let row = enemy.row + rowStep

        let steps = Math.min(
            Math.abs(row - endRow), 
            Math.abs(col - endCol)
        ) + 1

        let foundVacantCells = []

        for (let i = 0; i < steps; i++) {
            if (!this._isWhiteCell(row, col) && this._cells[row]) {
                let cell = this._cells[row][col]

                if (cell instanceof Figure) {
                    break
                }

                if (cell instanceof VacantCell) {
                    foundVacantCells.push(cell)
                }
            }

            row += rowStep
            col += colStep
        }

        return foundVacantCells
    }

    /**
     * @param {Figure} figure 
     * 
     * @returns {Array}
     */
    _getEnemiesThatCanBeBeatenByFigure(figure) {
        let cells = []
        let maxStep = figure.isQueen() ? Board.BOARD_SIZE - 2 : 1

        for (let step = 1; step <= maxStep; step++) {
            for (let row of [figure.row + step, figure.row - step]) {
                for (let col of [figure.col + step, figure.col - step]) {
                    if (col <= 0 || col >= (Board.BOARD_SIZE - 1) || row <= 0 || row >= (Board.BOARD_SIZE - 1)) {
                        // Out of the board or board borders
                        continue
                    }

                    if (!this._isWhiteCell(row, col) && this._cells[row] && this._cells[row][col]) {
                        cells.push(this._cells[row][col])
                    }
                }
            }
        }

        let enemies = []

        for (let enemy of cells) {
            if (enemy instanceof Figure) {
                let vacantCellsAfterEnemy = this._getVacantCellsAfterEnemy(figure, enemy)

                if (
                    !this._deadFigures.includes(enemy) &&
                    enemy.color !== figure.color && 
                    vacantCellsAfterEnemy.length &&
                    this._isCellAvailableForTheFigure(figure, vacantCellsAfterEnemy[0] /* We can check only first vacant cell after enemy in this case */)
                ) {
                    enemies.push(enemy)
                }
            }
        }

        return enemies
    }

    /**
     * Clean up the board from beaten figures
     */
    _removeDeadFiguresFromTheBoard() {
        this._deadFigures.map((dead) => {
            // Replace figure with vacant cell
            return this._cells[dead.row][dead.col] = this._createVacantCell(dead.row, dead.col)
        })

        this._deadFigures = []
    }

    _checkIfSomebodyWins() {
        // If one has no figures - another win
        let whites = this._getTeamFigures(Figure.WHITE)

        if (!whites.length) {
            this._endGame(Figure.BLACK)

            return
        }

        let blacks = this._getTeamFigures(Figure.BLACK)

        if (!blacks.length) {
            this._endGame(Figure.WHITE)

            return
        }

        let whiteHasSteps = false

        for (let white of whites) {
            for (let vacantCell of this._getVacantCells()) {
                if (this._isCellAvailableForTheFigure(white, vacantCell)) {
                    whiteHasSteps = true
                }
            }

            if (!whiteHasSteps && this._getEnemiesThatCanBeBeatenByFigure(white).length) {
                whiteHasSteps = true
            }
        }

        if (!whiteHasSteps) {
            // If there are no more moves for one of the players - he losed
            this._endGame(Figure.BLACK)

            return
        }

        let blackHasSteps = false

        for (let black of blacks) {
            for (let vacantCell of this._getVacantCells()) {
                if (this._isCellAvailableForTheFigure(black, vacantCell)) {
                    blackHasSteps = true
                }
            }

            if (!blackHasSteps && this._getEnemiesThatCanBeBeatenByFigure(black).length) {
                blackHasSteps = true
            }
        }

        if (!blackHasSteps) {
            // If there are no more moves for one of the players - he losed
            this._endGame(Figure.WHITE)

            return
        }
    }

    /**
     * @returns {Array}
     */
    _getVacantCells() {
        let vacantCells = []

        for (let [i, row] of Object.entries(this._cells)) {
            for (let [j, cell] of Object.entries(row)) {
                if (cell instanceof VacantCell) {
                    vacantCells.push(cell)
                }
            }
        }

        return vacantCells
    }

    /**
     * @param {string} color
     * 
     * @returns {Array} 
     */
    _getTeamFigures(color) {
        let teamFigures = []

        for (let [i, row] of Object.entries(this._cells)) {
            for (let [j, cell] of Object.entries(row)) {
                if (cell instanceof Figure && cell.color === color) {
                    teamFigures.push(cell)
                }
            }
        }

        return teamFigures
    }

    /**
     * @param {string} winnerColor 
     */
    _endGame(winnerColor) {
        this.broadcast({
            type: Board.ACTION_GAME_OVER,
            payload: winnerColor
        })
    }

    /**
     * @param {number} row 
     * @param {number} col
     * 
     * @returns {boolean} 
     */
    _isWhiteCell(row, col) {
        return (0 === ((row + col) % 2))
    }

    /**
     * @param {number} row 
     * @param {number} col 
     * 
     * @returns {Object}
     */
    _initCell(row, col) {
        let figure = null
        let vacantCell = null

        if (row < this._rowsCount) {
            // blacks
            figure = this._createFigure(
                row,
                col,
                !this._amIPlayWhite,
                Figure.BLACK
            )
        } else if (row > Board.BOARD_SIZE - this._rowsCount - 1) {
            // whites
            figure = this._createFigure(
                row,
                col,
                this._amIPlayWhite,
                Figure.WHITE
            )
        } else if (!this._isWhiteCell(row, col)) {
            // empty black cell
            vacantCell = this._createVacantCell(row, col)
        } else {
            // white cell, nothing to do here
        }

        return {
            vacantCell,
            figure,
        }
    }

    /**
     * @param {number} row 
     * @param {number} col 
     * @param {boolean} isCurrentPlayer 
     * @param {string} color 
     */
    _createFigure(row, col, isCurrentPlayer, color) {
        return new Figure(
            row, 
            col, 
            isCurrentPlayer, 
            color, 
            this._boardMargins, 
            this._cellSize
        )
    }

    /**
     * @param {number} row 
     * @param {number} col 
     */
    _createVacantCell(row, col) {
        return new VacantCell(
            row, 
            col,
            this._boardMargins, 
            this._cellSize
        )
    }

    /**
     * @param {number} row
     * 
     * @returns {number} 
     */
    _convertRowToNumber(row) {
        return Board.BOARD_SIZE - row
    }

    /**
     * @param {number} col
     * @returns {string} 
     */
    _convertColToChar(col) {
        return ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L' /* enough */][col]
    }
}
