const xmlBuilder = require('xmlbuilder');
const xmlParser = require('fast-xml-parser');
const AbstractPlugin =
    require('renew-simulator-gateway/src/plugin/AbstractPlugin');

const CCPNProcess = require('./CCPNProcess');

class CCPNSimulatorPlugin extends AbstractPlugin {

    constructor () {
        super();
        this.ccpn = new CCPNProcess();
        this.isLoaded = false;
    }

    getName () {
        return 'CCPNSimulatorPlugin';
    }

    getProvidedFormalisms () {
        return [
            {
                id: 'ccpn',
                name: 'CCPN Formalism',
                metaModel: {
                    type: 'pt',
                    format: 'pnml-renew',
                },
            },
        ];
    }

    registerHandlers (socket) {
        this.ccpn.read((buffer) => {
            const msg = buffer.toString().replace(/\n/g, '');
            console.log(this.name + ': ', msg);

            const data = xmlParser.parse(msg);
            const elementName = Object.keys(data)[0];
            switch (elementName) {
                case 'ccpnOutput':
                    if (data[elementName].hasOwnProperty('error')) {
                        this.sendError(socket, data[elementName].error);
                    } else {
                        console.log(this.name + ':  Initialized');
                        this.sendInitialized(socket);
                    }
                    break;
                case 'error':
                    this.sendError(socket, data[elementName]);
                    break;
                case 'netMarking':
                    this.updateMarking(socket, data[elementName]);
                    break;
            }
        });
    }

    initSimulation (formalismId, netInstance, serializedData) {
        console.log(this.name + ': Initializing simulation ...');
        this.netInstance = netInstance;
        this.indexPlaces();
        const load = xmlBuilder.create('load')
            // .att('baseFile', 'foo.pnml')
            .raw(serializedData.payload);
        this.ccpn.sendElement(load);
        this.isLoaded = true;
        this.step();
    }

    start () {
        this.ccpn.sendElement('run');
    }

    step () {
        this.ccpn.sendElement('step');
    }

    stop () {
        this.ccpn.sendElement('stop');
    }

    terminate () {
        this.isLoaded = false;
        this.ccpn.respawn();
    }

    getMarking () {
        if (this.isLoaded) {
            this.ccpn.sendElement('getMarking');
        }
    }

    updateMarking (socket, netMarking) {
        if (!netMarking.placeState || !Array.isArray(netMarking.placeState)) {
            return;
        }

        const newMarking = netMarking.placeState.map((placeState, index) => {
            return {
                parentId: this.places[index].id,
                text: placeState.token || '',
                type: 'pt:marking',
            }
        });

        this.sendMarking(socket, newMarking);
    }

}

module.exports = new CCPNSimulatorPlugin();
