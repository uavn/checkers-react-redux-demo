import moment from "moment"

/** @class */
export default class Game 
{
    /**
     * 
     * @param {string} name 
     * @param {number} userId 
     * @param {number} id 
     * @param {Moment} time 
     * @param {boolean} started 
     * @param {boolean} local 
     * @param {boolean} ingame 
     */
    constructor(
        name, 
        userId = null, 
        id = 0, 
        time = moment(), 
        started = false, 
        local = false, 
        ingame = false
    ) {
        this.name = name
        this.userId = userId || this.getUserId()
        this.id = id
        this.time = time
        this.started = started
        this.local = local
        this.steps = []
        this.ingame = ingame
    }

    /**
     * @param {Object} steps 
     */
    setSteps(steps) {
        this.steps = steps
    }

    /**
     * @returns {Object}
     */
    toJson() {
        let game = {
            name: this.name,
            userId: this.userId,
            time: this.time.unix(),
            started: this.started,
            steps: this.steps,
            local: this.local,
            ingame: this.ingame,
        }

        if (this.id) {
            game.id = this.id
        }

        return game
    }

    /**
     * @param {Object} param
     * @return {Game}
     */
    static fromMongoDocument({name, userId, _id, time, started, ingame, steps}) {
        const self = new Game(name, userId, _id.toString(), time, started, false, ingame)

        if (steps) {
            self.setSteps(steps)
        }
        
        return self
    }

    /**
     * @returns {boolean}
     */
    isMy() {
        return this.userId === localStorage.getItem('userId')
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
}
