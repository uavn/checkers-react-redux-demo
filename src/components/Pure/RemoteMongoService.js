import {Stitch, RemoteMongoClient} from 'mongodb-stitch-browser-sdk'

export default {
    //@TODO move to config
    MONGO_ATLAS_REMOTE_APP_ID: 'checkers-fxsmu',
    client: null,
    dbs: {},

    getMongo(dbName) {
        if (!this.client) {
            this.client = Stitch.initializeDefaultAppClient(this.MONGO_ATLAS_REMOTE_APP_ID)
        }

        if (!this.dbs[dbName]) {
            this.dbs[dbName] = this.client.
                getServiceClient(RemoteMongoClient.factory, 'mongodb-atlas').
                db(dbName)
        }

        return {client: this.client, db: this.dbs[dbName]}
    }
}
