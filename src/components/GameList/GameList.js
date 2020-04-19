import React from 'react'
import {connect} from 'react-redux'
import './GameList.css'
import {selectGame, setGameList, showLoader, hideLoader, alertMessage} from './../../redux/actions'
import MultiplayerService from '../Pure/MultiplayerService'

/** @class */
class GameList extends React.Component
{
    /** @type {MultiplayerService} */
    multiplayerService
    
    componentDidMount() {
        this.initMultiplayer()
    }

    componentWillUnmount() {
        this.multiplayerService.unsubscribeAll()
    }

    initMultiplayer() {
        this.multiplayerService = new MultiplayerService()

        let eventCallbackMap = {
            [MultiplayerService.ACTION_GAMES_ADDED]: (games) => {
                if (games) {
                    this.props.setGameList(games)
                }
                
                this.props.hideLoader()
            },

            [MultiplayerService.ACTION_YOUR_GAME_ADDED]: (payload) => {
                // You craeted a game
                this.props.setGameList(payload)
                this.props.hideLoader()
            },

            [MultiplayerService.ACTION_GAME_STARTED]: (game) => {
                // You connected to a game or somebody connected to your game
                this.props.selectGame(game)
                this.props.hideLoader()
            },
            
            [MultiplayerService.ERROR_APPEAR]: (payload) => {
                alert(payload || 'An error occured')
            },
        }

        this.multiplayerService.subscribe((action) => {
            if (typeof eventCallbackMap[action.type] !== 'undefined')  {
                eventCallbackMap[action.type](action.payload)
            }
        })

        this.props.showLoader()
        this.multiplayerService.initListHeartbeat()
    }

    /**
     * @param {Object} e 
     */
    createGame(e) {
        e.preventDefault()

        let games = this.props.gameList
        let name = prompt('Назва гри') || `Нова гра ${games.length ? games.length : ''}`

        this.props.showLoader()
        this.multiplayerService.createGame(name)
    }

    /**
     * @param {Object} e 
     */
    createLocalGame(e) {
        e.preventDefault()

        this.props.selectGame({
            local: true,
            my: true
        })
    }

    /**
     * @param {Object} e 
     * @param {Object} game 
     */
    startGame(e, game) {
        e.preventDefault()

        this.multiplayerService.startGame(game)
    }

    render() {
        return (
            <div className="list-block">
                <h2 className="list-head">Вибір гри</h2>
    
                {this.props.gameList.length 
                    ?
                    <div className="games-list">
                        {this.props.gameList.map(game => {
                            return (
                                <div className="list-item" key={game.id} onClick={(e) => {this.startGame(e, game)}}>{game.name}</div>
                            )
                        })}
                    </div>
                    :
                    <div className="no-games">Немає створених ігор</div>
                }
    
                <a className="btn btn-create-game" href="#" onClick={(e) => {this.createGame(e)}}>Створити гру</a>
                <a className="btn btn-local-game" href="#" onClick={(e) => {this.createLocalGame(e)}}>Локальна гра</a>
            </div>
        )
    }
}

const mapStateToProps = state => {
    return {
        gameList: state.game.gameList
    }
}

export default connect(mapStateToProps, {
    selectGame, 
    setGameList,
    showLoader,
    hideLoader,
    alertMessage
})(GameList)
