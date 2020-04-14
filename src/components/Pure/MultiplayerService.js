import Observer from './Base/Observer'

/** @class */
export default class MultiplayerService extends Observer
{   
    //@TODO
    // static SERVER_URL = 'http://192.168.31.31:1234/'
    static SERVER_URL = 'http://checkers.uartema.com/server/'

    static ACTION_GAMES_ADDED = 'ACTION_GAMES_ADDED'
    static ACTION_YOUR_GAME_ADDED = 'ACTION_YOUR_GAME_ADDED'
    static ACTION_GAME_STARTED = 'ACTION_GAME_STARTED'
    static ACTION_STEP_MADE = 'ACTION_STEP_MADE'
    static ACTION_STEP_SENT = 'ACTION_STEP_SENT'
    static ERROR_APPEAR = 'ERROR_APPEAR'

    /** @type {string} */
    _userId

    /** @type {number} */
    _listFileTime = 0

    /** @type {number} */
    _gameTime = 0

    /** @type {number} */
    _requestsCount = 500

    /** @type {number} */
    _gameRequestsCount = 1000

    /** @type {Object} */
    _game = null

    constructor() {
        super()

        this._userId = this.generateUserId()

        this.subscribe((action) => {
            switch (action.type) {
                case MultiplayerService.ACTION_GAME_STARTED:
                    this._game = action.payload
                    break
            }
        })
    }

    /**
     * @returns {string}
     */
    generateUserId() {
        return [...Array(10)].map( i =>(~~(Math.random()*36)).toString(36)).join('') // just a random key
    }

    /**
     * Of course heartbeat is not the best way to make such things - but my hostings doesn't allow me to use websockets
     */
    initListHeartbeat() {
        !this._game && fetch(MultiplayerService.SERVER_URL + '?action=list&time=' + this._listFileTime + '&userId=' + this._userId)
            .then(response => response.json())
            .then(resp => {
                if (resp.connectToGame) {
                    let game = resp.connectToGame
                    game.my = true
                    
                    this.broadcast({
                        type: MultiplayerService.ACTION_GAME_STARTED,
                        payload: game
                    })
    
                    return
                }

                this.broadcast({
                    type: MultiplayerService.ACTION_GAMES_ADDED,
                    payload: resp
                })

                this._listFileTime = resp.time
                this._requestsCount--

                if (this._requestsCount <= 0) {
                    //alert('Disconnected due to inactivity, please reload the page')
                } else {
                    setTimeout(() => {
                        this.initListHeartbeat()
                    }, 3000)
                }
            })
            .catch(err => {
                this.broadcast({
                    type: MultiplayerService.ERROR_APPEAR,
                })
            })
    }

    /**
     * @param {string} name 
     */
    createGame(name) {
        fetch(MultiplayerService.SERVER_URL + '?action=add', {
                method: 'POST',
                body: JSON.stringify({
                    name,
                    userId: this._userId
                })
            })
            .then(response => response.json())
            .then(games => {
                this.broadcast({
                    type: MultiplayerService.ACTION_YOUR_GAME_ADDED,
                    payload: games
                })
            })
            .catch(err => {
                this.broadcast({
                    type: MultiplayerService.ERROR_APPEAR,
                })
            })
    }

    /**
     * @param {string} game 
     */
    startGame(game) {
        fetch(MultiplayerService.SERVER_URL + '?action=start', {
                method: 'POST',
                body: JSON.stringify({
                    gameId: game.id,
                    userId: this._userId
                })
            })
            .then(response => response.json())
            .then(resp => {
                this.broadcast({
                    type: MultiplayerService.ACTION_GAME_STARTED,
                    payload: game
                })
            })
            .catch(err => {
                this.broadcast({
                    type: MultiplayerService.ERROR_APPEAR,
                })
            })
    }

    /**
     * Of course heartbeat is not the best way to make such things - but my hostings doesn't allow me to use websockets
     * 
     * @param {number} gameId 
     */
    listenServerHeartbeat(gameId) {
        fetch(MultiplayerService.SERVER_URL + '?action=game&time=' + this._gameTime + '&gameId=' + gameId)//@TODO
            .then(response => response.json())
            .then(resp => {
                this.broadcast({
                    type: MultiplayerService.ACTION_STEP_MADE,
                    payload: resp
                })

                this._gameTime = resp.time
                this._gameRequestsCount--

                if (this._gameRequestsCount <= 0) {
                    //alert('Disconnected due to inactivity, please reload the page')
                } else {
                    setTimeout(() => {
                        this.listenServerHeartbeat(gameId)
                    }, 3000)
                }
            })
            .catch(err => {
                this.broadcast({
                    type: MultiplayerService.ERROR_APPEAR,
                })
            })
    }

    /**
     * @param {Object} param 
     */
    notifyServer({gameId, from, to, color}) {
        fetch(MultiplayerService.SERVER_URL + '?action=step', {
                method: 'POST',
                body: JSON.stringify({
                    gameId,
                    from, 
                    to,
                    color
                })
            })
            .then(response => response.json())
            .then(resp => {
                this.broadcast({
                    type: MultiplayerService.ACTION_STEP_SENT,
                    payload: resp
                })
            })
            .catch(err => {
                this.broadcast({
                    type: MultiplayerService.ERROR_APPEAR,
                })
            })
    }
}
