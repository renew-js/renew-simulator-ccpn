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
        this.isInitialized = false;
        this.places = null;
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

            const data = xmlParser.parse(msg, {
                ignoreAttributes: false,
                attributeNamePrefix: '',
                attrNodeName: 'attributes',
                textNodeName: 'text',
            });
            const elementName = Object.keys(data)[0];
            switch (elementName) {
                case 'ccpnOutput':
                    if (data[elementName].hasOwnProperty('error')) {
                        this.sendError(socket, data[elementName].error);
                    }
                    break;
                case 'error':
                    this.sendError(socket, data[elementName]);
                    break;
                case 'netMarking':
                    if (!this.isInitialized) {
                        console.log(this.name + ':  Initialized');
                        this.isInitialized = true;
                        this.sendInitialized(socket);
                    }
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

    indexPlaces () {
        this.places = this.netInstance.elements.filter((element) => {
            return element.metaObject
                && element.metaObject.targetType === 'place';
        });
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
        this.isInitialized = false;
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

        const elements = netMarking.placeState.map((placeState, index) => {
            const element = {
                parentId: this.places[index].id,
                text: '',
                type: 'pt:marking',
            };
            if (placeState.token && placeState.token.text) {
                element.text = placeState.token.text;
            }
            return element;
        });
        const isHalted = netMarking.attributes
            && netMarking.attributes.stopped === 'True';

        const newMarking = {
            elements,
            isHalted,
        }

        this.sendMarking(socket, newMarking);
    }

}

module.exports = new CCPNSimulatorPlugin();
