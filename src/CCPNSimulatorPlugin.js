const CCPNProcess = require('./CCPNProcess');

class CCPNSimulatorPlugin {

    constructor () {
        this.name = 'CCPNSimulatorPlugin';
        this.provides = [
            {
                id: 'ccpn',
                name: 'CCPN Formalism',
                metaModel: {
                    type: 'pt',
                    format: 'pnml-renew',
                },
            },
        ];

        this.ccpn = new CCPNProcess();
        this.ccpn.read((data) => {
            process.stdout.write(data);
        });
    }

    initialize (server) {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

    start (formalismId, data) {
        console.log(formalismId, data);
        this.ccpn.write(data);
    }

}

module.exports = new CCPNSimulatorPlugin();
