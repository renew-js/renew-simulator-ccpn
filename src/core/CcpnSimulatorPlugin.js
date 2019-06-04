class CcpnSimulatorPlugin {

    constructor () {
        this.name = 'CcpnSimulatorPlugin';
        this.provides = [
            { id: 'ccpn', name: 'CCPN Simulator' },
        ];
    }

    initialize (server) {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

}

module.exports = new CcpnSimulatorPlugin();
