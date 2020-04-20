import React from 'react'
import {connect} from 'react-redux'
import './GameList.css'
import {
    selectGame,
    setGameList,
    showLoader,
    hideLoader,
    alertMessage,
    multiplayerListHeartbeat,
    multiplayerCreateGame,
    multiplayerStartGame
} from './../../redux/actions'

/** @class */
class GameList extends React.Component
{
    componentDidMount() {
        this.props.multiplayerListHeartbeat()
    }

    /**
     * @param {Object} e 
     */
    createGame(e) {
        e.preventDefault()

        this.props.multiplayerCreateGame(prompt('Назва гри'))
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

        this.props.multiplayerStartGame(game)
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
    
                <button className="btn btn-create-game" onClick={(e) => {this.createGame(e)}}>Створити гру</button>
                <button className="btn btn-local-game" onClick={(e) => {this.createLocalGame(e)}}>Локальна гра</button>
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
    alertMessage,
    multiplayerListHeartbeat,
    multiplayerCreateGame,
    multiplayerStartGame,
})(GameList)
