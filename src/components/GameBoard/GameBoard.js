import React from 'react'
import {connect} from 'react-redux'

import {alertMessage, moveFigure, showLoader, hideLoader} from './../../redux/actions'

import './GameBoard.css'

import FigureView from './FigureView/FigureView'
import VacantCellView from './VacantCellView/VacantCellView'
import FlyingFigure from './FlyingFigure/FlyingFigure'

import Board from './../Pure/Board'
import Figure from './../Pure/Figure'
import VacantCell from './../Pure/VacantCell'
import { MESSAGE_YOU_SHOULD_FIGHT_WITH_THIS_FIGURE, MESSAGE_YOU_SHOULD_BEAT, MESSAGE_YOU_CANT_GO_HERE, MESSAGE_THIS_IS_NOT_YOUR_STEP, MESSAGE_GO_BLACK, MESSAGE_GO_WHITE, MESSAGE_HEY_GO_BEAT_SOMEONE_MORE, MESSAGE_THIS_IS_NOT_YOUR_FIGURE } from '../GameMessages/Messages'
import MultiplayerService from '../Pure/MultiplayerService'

/** @class */
class GameBoard extends React.Component {
    /** @type {Object} */
    state = {
        takenFigure: null
    }

    /** @type {Board} */
    board

    /** @type {Object} */
    game
    
    /** @type {number} */
    lastRemoteStepIdx = -1

    /** @type {MultiplayerService} */
    multiplayerService

    componentDidMount() {
        this.multiplayerService = new MultiplayerService()
        this.game = this.props.game
        this.initBoard()
        this.props.hideLoader()
    }

    componentWillUnmount() {
        this.unsubscribeAllEvents()
    }

    initBoard() {
        this.board = new Board({
            amIPlayWhite: !!this.game.my,
            localGame: !!this.game.local,
            boardMargins: {
                top: 38,
                left: 38
            },
            cellSize: 43,
            // map: [
            //     '- + - + - + - +',
            //     '+ - + - + - + -',
            //     '- b - + - + - +',
            //     '+ - + - + - b -',
            //     '- w - w - + - +',
            //     '+ - w - + - + -',
            //     '- + - w - w - w',
            //     'w - + - w - + -',
            // ]
        })

        this.initEvents()
        this.initMultiplayer()
    }

    initEvents() {
        let eventCallbackMap = {
            [Board.ACTION_MESSAGE]: (payload) => {
                this.props.alertMessage(payload)
            },

            [Board.ACTION_INIT]: (payload) => {
                this.props.moveFigure(payload)
            },

            [Board.ACTION_STEP]: (payload) => {
                // this.props.moveFigure(payload)
            },

            [Board.ACTION_I_MADE_A_STEP]: (payload) => {
                this.notifyServer(payload)
            },

            [Board.ACTION_GAME_OVER]: (payload) => {
                this.props.alertMessage(payload + ' wins')
            },

            [Board.ACTION_MESSAGE_YOU_SHOULD_FIGHT_WITH_THIS_FIGURE]: (payload) => {
                this.props.alertMessage(MESSAGE_YOU_SHOULD_FIGHT_WITH_THIS_FIGURE)

                payload.map(figure => {
                    figure.highlight()

                    setTimeout(() => {
                        figure.unhighlight()

                        this.forceUpdate()
                    }, 1500)
                })
            },

            [Board.ACTION_MESSAGE_THIS_IS_NOT_YOUR_FIGURE]: (payload) => {
                this.props.alertMessage(MESSAGE_THIS_IS_NOT_YOUR_FIGURE)
            },

            [Board.ACTION_MESSAGE_YOU_SHOULD_BEAT]: (payload) => {
                this.props.alertMessage(MESSAGE_YOU_SHOULD_BEAT)

                payload.map(cell => {
                    cell.highlight()

                    setTimeout(() => {
                        cell.unhighlight()

                        this.forceUpdate()
                    }, 1500)
                })
            },

            [Board.ACTION_MESSAGE_YOU_CANT_GO_HERE]: (payload) => {
                this.props.alertMessage(MESSAGE_YOU_CANT_GO_HERE)
            },

            [Board.ACTION_MESSAGE_THIS_IS_NOT_YOUR_STEP]: (payload) => {
                this.props.alertMessage(MESSAGE_THIS_IS_NOT_YOUR_STEP)
            },

            [Board.ACTION_MESSAGE_GO_BLACK]: (payload) => {
                this.props.alertMessage(MESSAGE_GO_BLACK)
            },

            [Board.ACTION_MESSAGE_GO_WHITE]: (payload) => {
                this.props.alertMessage(MESSAGE_GO_WHITE)
            },

            [Board.ACTION_MESSAGE_HEY_GO_BEAT_SOMEONE_MORE]: (payload) => {
                this.props.alertMessage(MESSAGE_HEY_GO_BEAT_SOMEONE_MORE)
            },
        }

        this.board.subscribe((action) => {
            if (typeof eventCallbackMap[action.type] !== 'undefined')  {
                eventCallbackMap[action.type](action.payload)
            }
        })

        this.board.init()
    }

    initMultiplayer() {
        let mpEventCallbackMap = {
            [MultiplayerService.ACTION_STEP_MADE]: (game) => {
                if (game && game.steps && game.steps.length) {
                    for (let idx = (this.lastRemoteStepIdx + 1); idx < game.steps.length; idx++) {
                        this.lastRemoteStepIdx = idx
                        let step = game.steps[idx]

                        if (step.color && this.board.getMyColor() !== step.color) {
                            this.board.makeStep(step.from, step.to)
            
                            this.setState({
                                takenFigure: null,
                            })
                        }
                    }
                }
            },

            [MultiplayerService.ERROR_APPEAR]: () => {
                this.props.alertMessage('An error occured')
            },
        }

        this.multiplayerService.subscribe((action) => {
            if (typeof mpEventCallbackMap[action.type] !== 'undefined')  {
                mpEventCallbackMap[action.type](action.payload)
            }
        })

        this.listenServer()
    }

    unsubscribeAllEvents() {
        this.board.unsubscribeAll()
        this.multiplayerService.unsubscribeAll()
    }

    dropAway() {
        this.setState({takenFigure: null})
    }

    /**
     * @param {Figure} figure 
     */
    takeFigure(figure) {
        // Register single drop figure away event listener
        window.addEventListener('mouseup', () => this.dropAway(), {once : true})
        
        this.setState({takenFigure: figure})
    }

    /**
     * @param {VacantCell} vacantCell
     */
    dropOnVacantCell(vacantCell) {
        let figure = this.state.takenFigure

        if (figure) {
            this.board.moveFigureItIsPossible(figure, vacantCell)
        }

        this.setState({
            takenFigure: null,
        })
    }

    listenServer() {
        if (!this.game || this.game.local) {
            return
        }

        this.multiplayerService.listenServerHeartbeat(this.game.id)
    }

    /**
     * @param {Object} coords 
     */
    notifyServer({color, from, to}) {
        if (!this.game || this.game.local) {
            return
        }

        this.multiplayerService.notifyServer({gameId: this.game.id, from, to, color})
    }

    render() {
        return (
            <div className="board">
                {this.state.takenFigure && <FlyingFigure figure={this.state.takenFigure}/>}

                {this.props.cells && Object.entries(this.props.cells).map(([i, row]) => {
                    return Object.entries(row).map(([j, cell]) => {
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
        game: state.game.game
    }
}

export default connect(mapStateToProps, {
    alertMessage, 
    moveFigure,
    showLoader,
    hideLoader,
})(GameBoard)
