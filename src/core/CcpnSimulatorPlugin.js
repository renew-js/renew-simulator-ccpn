class CcpnSimulatorPlugin {

    constructor () {
        this.name = 'CcpnSimulatorPlugin';
        this.provides = [
            { id: 'ccpn', name: 'CCPN Formalism' },
        ];
    }

    initialize (server) {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

}

module.exports = new CcpnSimulatorPlugin();
