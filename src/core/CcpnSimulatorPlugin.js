class CcpnSimulatorPlugin {

    constructor () {
        this.name = 'CcpnSimulatorPlugin';
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
        this.server = null;
    }

    initialize (server) {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

    start (formalismId, data) {
        console.log(formalismId, data);
    }

}

module.exports = new CcpnSimulatorPlugin();
