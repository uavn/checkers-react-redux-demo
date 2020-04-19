import moment from "moment"
import Moment from "react-moment"

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
        userId, 
        id = 0, 
        time = moment(), 
        started = false, 
        local = false, 
        ingame = false
    ) {
        this.name = name
        this.userId = userId
        this.id = id
        this.time = time
        this.started = started
        this.local = local
        this.steps = []
        this.ingame = ingame
    }

    /**
     * 
     * @param {Object} steps 
     */
    setSteps(steps) {
        this.steps = steps
    }

    /**
     * @returns {Object}
     */
    toJson() {
        return {
            name: this.name,
            userId: this.userId,
            id: this.id,
            time: this.time.unix(),
            started: this.started,
            steps: this.steps,
            local: this.local,
            ingame: this.ingame,
        }
    }

    /**
     * 
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
}
