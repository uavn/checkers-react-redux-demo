import { call, put, select, takeEvery } from 'redux-saga/effects'
import { AnonymousCredential, BSON, Stitch, RemoteMongoClient } from 'mongodb-stitch-browser-sdk'
import moment from 'moment'

import { 
    MULTIPLAYER_LIST_HEARTBEAT,
    MULTIPLAYER_FLAG_GAME,
    MULTIPLAYER_CREATE_GAME,
    MULTIPLAYER_START_GAME,
    MULTIPLAYER_GAME_HEARTBEAT,
    MULTIPLAYER_GAME_SEND_STEP,
} from "./types";
import { 
    alertMessage,
    setGameList,
    hideLoader,
    showLoader,
    multiplayerListHeartbeat,
    multiplayerFlagGame,
    multiplayerGameHeartbeat,
    selectGame,
    setGameSteps,
} from './actions';

import Game from '../components/Pure/Game'

// Params
// max requests count in list
let requestsCount = 100
// max requests count in game
let gameRequestsCount = 1000
// games lifetime in the list - 5 min
let gameInListLifetime = 5 * 60
// max games count in the list
let gameInListLimit = 100
// max games count in the list - 3 sec
let gameInListTimeoutBetweenRequests = 3 * 1000

//@TODO move to config
const MONGO_ATLAS_REMOTE_DB_NAME = 'checkers-db'
const MONGO_ATLAS_REMOTE_COLLECTION_NAME = 'checkers-collection'
const MONGO_ATLAS_REMOTE_APP_ID = 'checkers-fxsmu'

const getGame = state => state.game.game

let mongoClient = null
let mongoDbs = []

/**
 * Lazy load for mongo client
 * 
 * @param {string} dbName 
 */
const getMongo = (dbName) => {
    if (!mongoClient) {
        mongoClient = Stitch.initializeDefaultAppClient(MONGO_ATLAS_REMOTE_APP_ID)
    }

    if (!mongoDbs[dbName]) {
        mongoDbs[dbName] = mongoClient
            .getServiceClient(RemoteMongoClient.factory, 'mongodb-atlas')
            .db(dbName)
    }

    return {client: mongoClient, db: mongoDbs[dbName]}
}

export function* watchMultiplayerActions() {
    yield takeEvery(MULTIPLAYER_LIST_HEARTBEAT, watchMultiplayerListHeartbeatAsync)
    yield takeEvery(MULTIPLAYER_FLAG_GAME, watchMultiplayerFlagGameAsync)
    yield takeEvery(MULTIPLAYER_CREATE_GAME, watchMultiplayerCreateGameAsync)
    yield takeEvery(MULTIPLAYER_START_GAME, watchMultiplayerStartGameAsync)
    yield takeEvery(MULTIPLAYER_GAME_HEARTBEAT, watchMultiplayerGameHeartbeatAsync)
    yield takeEvery(MULTIPLAYER_GAME_SEND_STEP, watchMultiplayerGameSendStepAsync)
}

async function waitABit() {
    const sleep = m => new Promise(r => setTimeout(r, m))

    return await sleep(gameInListTimeoutBetweenRequests)
}

/**
 * Fetch Game List
 * 
 * ... Of course heartbeat is not the best way to make such things - but mongodb altas which is used here do not provide me with websockets
 */
function* watchMultiplayerListHeartbeatAsync() {
    try {
        const docs = yield call(fetchGames)

        const games = docs.map(game => {
            return Game.fromMongoDocument(game)
        })

        const connectToGame = games.find(game => {
            return game.started && game.isMy() && !game.steps.length && !game.ingame
        })

        if (connectToGame) {
            yield put(selectGame({...connectToGame, my: true}))
            yield put(multiplayerFlagGame(connectToGame))
        }

        yield put(setGameList(games.filter(game => (!game.started && !game.ingame))))

        requestsCount--

        if (requestsCount <= 0) {
            throw new Error('Disconnected due to inactivity, reload the page to continue')
        } else {
            yield call(waitABit)

            const game = yield select(getGame)

            if (!game) {
                yield put(multiplayerListHeartbeat())
            }
        }
    } catch (e) {
        yield put(alertMessage(e.toString()))
    }
}

async function fetchGames() {
    const {client, db} = getMongo(MONGO_ATLAS_REMOTE_DB_NAME)

    return await client.auth.loginWithCredential(new AnonymousCredential()).then(() =>
        db.collection(MONGO_ATLAS_REMOTE_COLLECTION_NAME)
            .find({
                time: {
                    $gt: moment().unix() - gameInListLifetime
                },
            }, {
                limit: gameInListLimit
            })
            .asArray()
    )
}

/**
 * Flag Game
 * 
 * ... Of course heartbeat is not the best way to make such things - but mongodb altas which is used here do not provide me with websockets
 * 
 * @param {Object} action
 */
function* watchMultiplayerFlagGameAsync(action) {
    try {
        yield call(flagGame, action.payload)
        yield put(selectGame(action.payload))
    } catch (e) {
        yield put(alertMessage(e.toString()))
    }
}

/**
 * @param {Game} game 
 */
async function flagGame(game) {
    const {client, db} = getMongo(MONGO_ATLAS_REMOTE_DB_NAME)

    return await client.auth.loginWithCredential(new AnonymousCredential())
        .then(() =>
            db.collection(MONGO_ATLAS_REMOTE_COLLECTION_NAME)
                .updateOne({_id: new BSON.ObjectId(game.id)}, {$set: {ingame: true}})
        )
}

/**
 * Create Game
 * 
 * @param {Object} action 
 */
function* watchMultiplayerCreateGameAsync(action) {
    yield put(showLoader())

    try {
        if (action.payload) {
            yield call(createGame, action.payload)
        }
        yield put(hideLoader())
    } catch (e) {
        yield put(alertMessage(e.toString()))
    }
}

/**
 * @param {string} name 
 */
async function createGame(name) {
    const game = new Game(name)
    const {client, db} = getMongo(MONGO_ATLAS_REMOTE_DB_NAME)

    return await client.auth.loginWithCredential(new AnonymousCredential())
        .then(() =>
            db.collection(MONGO_ATLAS_REMOTE_COLLECTION_NAME)
                .insertOne({...game.toJson(), owner_id: client.auth.user.id})
        )
}

/**
 * Start Game
 * 
 * @param {Object} action 
 */
function* watchMultiplayerStartGameAsync(action) {
    try {
        const game = action.payload

        if (game.isMy()) {
            yield put(alertMessage('Ви намагаєтесь приєднатись до своєї ж гри, зачекайте на суперника'))
        } else {
            yield call(startGame, game)
            yield put(selectGame(game))
        }
    } catch (e) {
        yield put(alertMessage(e.toString()))
    }
}

/**
 * @param {Game} game 
 */
async function startGame(game) {
    const {client, db} = getMongo(MONGO_ATLAS_REMOTE_DB_NAME)

    return await client.auth.loginWithCredential(new AnonymousCredential())
        .then(() =>
            db.collection(MONGO_ATLAS_REMOTE_COLLECTION_NAME)
                .updateOne({_id: new BSON.ObjectId(game.id)}, {$set: {started: true}})
        )
}

/**
 * Game Heartbeat
 * 
 * ... Of course heartbeat is not the best way to make such things - but mongodb altas which is used here do not provide me with websockets
 * 
 * @param {Object} action
 */
function* watchMultiplayerGameHeartbeatAsync(action) {
    try {
        const game = yield select(getGame)

        if (!game || !game.id || game.local) {
            // If no game is selected or local game started - no need in multiplayer heartbeat
            return
        }

        const doc = yield call(fetchGame, game.id)
        const remoteGame = Game.fromMongoDocument(doc)
        yield put(setGameSteps(remoteGame.steps))

        gameRequestsCount--
    
        if (gameRequestsCount <= 0) {
            yield put(alertMessage('Disconnected due to inactivity, please reload the page'))
        } else {
            yield call(waitABit)

            const game = yield select(getGame)

            if (game) {
                yield put(multiplayerGameHeartbeat(game.id))
            }
        }
    } catch (e) {
        yield put(alertMessage(e.toString()))
    }
}

/**
 * @param {number} gameId 
 */
async function fetchGame(gameId) {
    const {client, db} = getMongo(MONGO_ATLAS_REMOTE_DB_NAME)

    return await client.auth.loginWithCredential(new AnonymousCredential()).then(() =>
        db.collection(MONGO_ATLAS_REMOTE_COLLECTION_NAME)
            .findOne({
                _id: new BSON.ObjectId(gameId)
            })
        )
}

/**
 * Send Step
 * 
 * @param {Object} action 
 */
function* watchMultiplayerGameSendStepAsync(action) {
    try {
        const game = yield select(getGame)
        const gameStep = action.payload

        if (!game || game.local || !gameStep || gameStep.gameId !== game.id) {
            // No need to send step to the server if game is local or game not set
            return
        }

        yield call(sendStep, gameStep)
    } catch (e) {
        yield put(alertMessage(e.toString()))
    }
}

/**
 * @param {Object} step 
 */
async function sendStep({gameId, from, to, color}) {
    const {client, db} = getMongo(MONGO_ATLAS_REMOTE_DB_NAME)

    return await client.auth.loginWithCredential(new AnonymousCredential())
        .then(() =>
            db.collection(MONGO_ATLAS_REMOTE_COLLECTION_NAME)
                .updateOne(
                    {_id: new BSON.ObjectId(gameId)}, 
                    {$push: {
                        steps: {from, to, color}
                    }}
                )
        )
}
