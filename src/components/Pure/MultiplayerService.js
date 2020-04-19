import {AnonymousCredential, BSON} from 'mongodb-stitch-browser-sdk'
import Observer from './Base/Observer'
import Game from './Game'
import moment from 'moment'
import mongo from './RemoteMongoService'

/** @class */
export default class MultiplayerService extends Observer
{   
    //@TODO
    static MONGO_ATLAS_REMOTE_APP_ID = 'checkers-fxsmu'
    static MONGO_ATLAS_REMOTE_DB_NAME = 'checkers-db'
    static MONGO_ATLAS_REMOTE_COLLECTION_NAME = 'checkers-collection'

    static ACTION_GAMES_ADDED = 'ACTION_GAMES_ADDED'
    static ACTION_YOUR_GAME_ADDED = 'ACTION_YOUR_GAME_ADDED'
    static ACTION_GAME_STARTED = 'ACTION_GAME_STARTED'
    static ACTION_STEP_MADE = 'ACTION_STEP_MADE'
    static ACTION_STEP_SENT = 'ACTION_STEP_SENT'
    static ERROR_APPEAR = 'ERROR_APPEAR'

    /** @type {string} */
    _userId

    /** @type {number} */
    _requestsCount = 100

    /** @type {number} */
    _gameRequestsCount = 1000

    /** @type {Object} */
    _game = null

    constructor() {
        super()

        this._userId = this.getUserId()

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
    getUserId() {
        let userId = localStorage.getItem('userId')

        if (!userId) {
            userId = [...Array(10)].map( i =>(~~(Math.random()*36)).toString(36)).join('')
            localStorage.setItem('userId', userId)
        }

        return userId
    }

    /**
     * Of course heartbeat is not the best way to make such things - but mongodb altas which is used here do not provide me with websockets
     */
    initListHeartbeat() {
        if (this._game) {
            return
        }

        const {client, db} = mongo.getMongo(MultiplayerService.MONGO_ATLAS_REMOTE_DB_NAME)

        client.auth.loginWithCredential(new AnonymousCredential()).then(() =>
            db.collection(MultiplayerService.MONGO_ATLAS_REMOTE_COLLECTION_NAME).
                find({
                    time: {
                        $gt: moment().unix() - 5 * 60 // 5 min old games to show
                    },
                }, {
                    limit: 100
                }).
                asArray()
        ).then(docs => {
            const games = docs.map(game => {
                return Game.fromMongoDocument(game)
            })

            const connectToGame = games.find(game => {
                return game.started && game.isMy() && !game.steps.length && !game.ingame
            })

            if (connectToGame) {
                this.broadcast({
                    type: MultiplayerService.ACTION_GAME_STARTED,
                    payload: {...connectToGame, my: true}
                })

                this.flagGame(connectToGame)

                return
            }

            this.broadcast({
                type: MultiplayerService.ACTION_GAMES_ADDED,
                payload: games.filter(game => (!game.started && !game.ingame))
            })

            this._requestsCount--

            if (this._requestsCount <= 0) {
                throw new Error('Disconnected due to inactivity, reload the page to continue')
            } else {
                setTimeout(() => {
                    this.initListHeartbeat()
                }, 5000)
            }
        }).catch(err => {
            this.broadcast({
                type: MultiplayerService.ERROR_APPEAR,
                payload: err
            })
        })
    }

    /**
     * @param {string} name 
     */
    createGame(name) {
        const {client, db} = mongo.getMongo(MultiplayerService.MONGO_ATLAS_REMOTE_DB_NAME)
        const game = new Game(name, this._userId)

        client.auth.loginWithCredential(new AnonymousCredential()).
            then(() =>
                db.collection(MultiplayerService.MONGO_ATLAS_REMOTE_COLLECTION_NAME)
                    .insertOne({...game.toJson(), owner_id: client.auth.user.id})
            ).catch(err => {
                this.broadcast({
                    type: MultiplayerService.ERROR_APPEAR,
                    payload: err
                })
            })
    }

    /**
     * @param {string} game 
     */
    startGame(game) {
        const {client, db} = mongo.getMongo(MultiplayerService.MONGO_ATLAS_REMOTE_DB_NAME)

        if (game.isMy()) {
            this.broadcast({
                type: MultiplayerService.ERROR_APPEAR,
                payload: 'Ви намагаєтесь приєднатись до своєї ж гри, зачекайте на суперника'
            })

            return
        }

        client.auth.loginWithCredential(new AnonymousCredential()).
            then(() =>
                db.collection(MultiplayerService.MONGO_ATLAS_REMOTE_COLLECTION_NAME)
                    .updateOne({_id: new BSON.ObjectId(game.id)}, {$set: {started: true}})
            )
            .then(() => {
                this.broadcast({
                    type: MultiplayerService.ACTION_GAME_STARTED,
                    payload: game
                })
            })
            .catch(err => {
                this.broadcast({
                    type: MultiplayerService.ERROR_APPEAR,
                    payload: err
                })
            })
    }

    /**
     * @param {string} game 
     */
    flagGame(game) {
        const {client, db} = mongo.getMongo(MultiplayerService.MONGO_ATLAS_REMOTE_DB_NAME)

        client.auth.loginWithCredential(new AnonymousCredential()).
            then(() =>
                db.collection(MultiplayerService.MONGO_ATLAS_REMOTE_COLLECTION_NAME)
                    .updateOne({_id: new BSON.ObjectId(game.id)}, {$set: {ingame: true}})
            )
            .then(() => {
                this.broadcast({
                    type: MultiplayerService.ACTION_GAME_STARTED,
                    payload: game
                })
            })
            .catch(err => {
                this.broadcast({
                    type: MultiplayerService.ERROR_APPEAR,
                    payload: err
                })
            })
    }

    /**
     * Of course heartbeat is not the best way to make such things - but mongodb altas which is used here do not provide me with websockets
     * 
     * @param {number} gameId 
     */
    listenServerHeartbeat(gameId) {
        if (!gameId) {
            return
        }

        const {client, db} = mongo.getMongo(MultiplayerService.MONGO_ATLAS_REMOTE_DB_NAME)

        client.auth.loginWithCredential(new AnonymousCredential()).then(() =>
            db.collection(MultiplayerService.MONGO_ATLAS_REMOTE_COLLECTION_NAME).
                findOne({
                    _id: new BSON.ObjectId(gameId)
                })
        ).then(doc => {
            const game = Game.fromMongoDocument(doc)

            this.broadcast({
                type: MultiplayerService.ACTION_STEP_MADE,
                payload: game
            })

            this._gameRequestsCount--

            if (this._gameRequestsCount <= 0) {
                this.broadcast({
                    type: MultiplayerService.ERROR_APPEAR,
                    payload: 'Disconnected due to inactivity, please reload the page'
                })
            } else {
                setTimeout(() => {
                    this.listenServerHeartbeat(gameId)
                }, 3000)
            }
        }).catch(err => {
            this.broadcast({
                type: MultiplayerService.ERROR_APPEAR,
                payload: err
            })
        })
    }

    /**
     * @param {Object} param 
     */
    notifyServer({gameId, from, to, color}) {
        const {client, db} = mongo.getMongo(MultiplayerService.MONGO_ATLAS_REMOTE_DB_NAME)
        const step = {from, to, color}

        client.auth.loginWithCredential(new AnonymousCredential()).
            then(() =>
                db.collection(MultiplayerService.MONGO_ATLAS_REMOTE_COLLECTION_NAME)
                    .updateOne(
                        {_id: new BSON.ObjectId(gameId)}, 
                        {$push: {
                            steps: step
                        }}
                    )
            )
            .then(() => {
                this.broadcast({
                    type: MultiplayerService.ACTION_STEP_SENT,
                })
            })
            .catch(err => {
                this.broadcast({
                    type: MultiplayerService.ERROR_APPEAR,
                    payload: err
                })
            })
    }
}
