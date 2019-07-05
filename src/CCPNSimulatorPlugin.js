const xmlBuilder = require('xmlbuilder');
const xmlParser = require('fast-xml-parser');

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
        this.netInstance = null;
        this.places = null;
        this.ccpn = new CCPNProcess();
    }

    initPlugin (serverManager) {
        serverManager.registerHandlers((socket) => {
            this.ccpn.read((buffer) => {
                const msg = buffer.toString().replace(/\n/g, '');
                console.log(this.name + ': ', msg);

                const data = xmlParser.parse(msg);
                const elementName = Object.keys(data)[0];
                switch(elementName) {
                    case 'error':
                        this.sendError(socket, data[elementName]);
                        break;
                    case 'netMarking':
                        this.updateMarking(socket, data[elementName]);
                        break;
                }
            });
        });
    }

    initSimulation (formalismId, netInstance, serializedData) {
        this.netInstance = netInstance;
        this.indexPlaces();
        const load = xmlBuilder.create('load')
            // .att('baseFile', 'foo.pnml')
            .raw(serializedData.payload);
        this.ccpn.sendElement(load);
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
        this.stop();
        this.ccpn.respawn();
    }

    getMarking () {
        this.ccpn.sendElement('getMarking');
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

    // TODO Move send methods to simulationManager without circular dependency
    sendError (socket, data) {
        socket.emit('simulation.error', data);
    }

    sendMarking (socket, data) {
        socket.emit('marking.update', data);
    }

}

module.exports = new CCPNSimulatorPlugin();
