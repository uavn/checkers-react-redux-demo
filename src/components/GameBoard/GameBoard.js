import React from 'react'
import {connect} from 'react-redux'

import {
    alertMessage,
    moveFigure,
    showLoader,
    hideLoader,
    multiplayerGameHeartbeat,
    multiplayerGameSendStep
} from './../../redux/actions'

import './GameBoard.css'

import FigureView from './FigureView/FigureView'
import VacantCellView from './VacantCellView/VacantCellView'
import FlyingFigure from './FlyingFigure/FlyingFigure'

import Board from './../Pure/Board'
import Figure from './../Pure/Figure'
import VacantCell from './../Pure/VacantCell'

/** @class */
class GameBoard extends React.Component {
    /** 
     * @type {Object}
     */
    state = {
        // No need to save this to redux, because it is only visual effect
        takenFigure: null
    }

    /**
     * Board instance
     *  
     * @type {Board} 
     */
    board

    /**
     * Remember the last step from the server that was applied to handle future steps
     * 
     * @type {number}
     */
    lastRemoteStepIdx = -1

    // Handle board events
    eventCallbackMap = {
        // Initialize board
        [Board.ACTION_INIT]: (cells) => {
            this.props.moveFigure(cells)
        },

        // Send step to the server
        [Board.ACTION_I_MADE_A_STEP]: (step) => {
            this.props.multiplayerGameSendStep({...step, gameId: this.props.game.id})
        },

        // Cell or figure highlight
        [Board.ACTION_YOU_SHOULD_FIGHT_WITH_THIS_FIGURE]: (figures) => {
            figures.forEach(figure => {
                figure.highlight()

                setTimeout(() => {
                    figure.unhighlight()

                    this.forceUpdate()
                }, 1500)
            })
        },

        [Board.ACTION_YOU_SHOULD_BEAT]: (cells) => {
            cells.forEach(cell => {
                cell.highlight()

                setTimeout(() => {
                    cell.unhighlight()

                    this.forceUpdate()
                }, 1500)
            })
        },

        // Messages action
        [Board.ACTION_MESSAGE]: (message) => {
            this.props.alertMessage(message)
        },
    }

    componentDidMount() {
        this.initBoard()
        // this.props.hideLoader()
    }

    componentWillUnmount() {
        this.board.unsubscribeAll()
    }

    componentDidUpdate() {
        // If new steps came from the server - handle them
        if (this.props.steps && this.props.steps.length) {
            for (let idx = (this.lastRemoteStepIdx + 1); idx < this.props.steps.length; idx++) {
                this.lastRemoteStepIdx = idx
                let step = this.props.steps[idx]

                if (step.color && this.board.getMyColor() !== step.color) {
                    this.board.makeStep(step.from, step.to)
    
                    this.setState({
                        takenFigure: null,
                    })
                }
            }
        }
    }

    initBoard() {
        // Initialize instance
        this.board = new Board({
            amIPlayWhite: !!this.props.game.my,
            localGame: !!this.props.game.local,
            boardMargins: {
                top: 38,
                left: 38
            },
            cellSize: 43,
            // map: [
            //     '- + - + - W - +',
            //     '+ - + - b - + -',
            //     '- + - + - + - +',
            //     '+ - + - b - + -',
            //     '- + - + - + - +',
            //     '+ - + - + - + -',
            //     '- + - b - + - +',
            //     'w - + - W - B -',
            // ]
        })

        // Subscribe to the events
        this.board.subscribe((action) => {
            if (typeof this.eventCallbackMap[action.type] !== 'undefined')  {
                this.eventCallbackMap[action.type](action.payload)
            }
        })

        // Initialize board cells and figures
        this.board.init()

        // Init multiplayer events if it is multiplayer game
        this.props.multiplayerGameHeartbeat()
    }

    /**
     * @param {Figure} figure 
     */
    takeFigure(figure) {
        // Register single drop figure away event listener
        window.addEventListener('mouseup', () => this.setState({takenFigure: null}), {once : true})
        
        // Take figure
        this.setState({takenFigure: figure})
    }

    /**
     * @param {VacantCell} vacantCell
     */
    dropOnVacantCell(vacantCell) {
        if (this.state.takenFigure) {
            // Make a step
            this.board.moveFigureItIsPossible(
                this.state.takenFigure,
                vacantCell
            )
        }

        // Release figure
        this.setState({
            takenFigure: null,
        })
    }

    render() {
        return (
            <div className="board">
                {this.state.takenFigure && <FlyingFigure figure={this.state.takenFigure}/>}

                {this.props.cells && Object.values(this.props.cells).map(row => {
                    return Object.values(row).map(cell => {
                        if (cell instanceof Figure) {
                            return <FigureView 
                                key={cell.id}
                                figure={cell}
                                takeMe={() => this.takeFigure(cell)}
                            />
                        }

                        if (cell instanceof VacantCell) {
                            return <VacantCellView 
                                key={cell.id}
                                cell={cell}
                                dropOnMe={() => this.dropOnVacantCell(cell)}
                            />
                        }

                        return null;
                    })
                })}
            </div>
        )
    }
}

const mapStateToProps = state => {
    return {
        cells: state.game.cells,
        game: state.game.game,
        steps: state.game.steps,
    }
}

export default connect(mapStateToProps, {
    alertMessage, 
    moveFigure,
    showLoader,
    hideLoader,
    multiplayerGameHeartbeat,
    multiplayerGameSendStep,
})(GameBoard)
