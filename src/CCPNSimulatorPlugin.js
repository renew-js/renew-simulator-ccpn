const builder = require('xmlbuilder');

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

    initSimulation (formalismId, data) {
        console.log(formalismId, data);
        const load = builder.create('load')
            // .att('baseFile', 'foo.pnml')
            .raw(data);
        this.ccpn.sendElement(load);
    }

    startRun () {
        // this.ccpn.
    }

    stopRun () {

    }

    terminateRun () {

    }

    step () {
        this.ccpn.sendElement('step');
        this.getMarking();
    }

    getMarking () {
        this.ccpn.sendElement('getMarking');
    }

}

module.exports = new CCPNSimulatorPlugin();
