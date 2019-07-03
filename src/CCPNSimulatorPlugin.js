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
    }

    initPlugin (serverManager) {
        this.ccpn = new CCPNProcess();

        serverManager.registerHandlers((socket) => {
            this.ccpn.read((buffer) => {
                const msg = buffer.toString().replace(/\n/g, '');
                console.log(this.name + ': ', msg);

                const data = xmlParser.parse(msg);
                const elementName = Object.keys(data)[0];
                switch(elementName) {
                    case 'error':
                        socket.emit('simulation.error', data[elementName]);
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

    startRun () {
        this.ccpn.sendElement('run');
        this.getMarking();
    }

    stopRun () {
        this.ccpn.sendElement('stop');
        this.getMarking();
    }

    terminateRun () {
        this.stopRun();
    }

    step () {
        this.ccpn.sendElement('step');
        this.getMarking();
    }

    getMarking () {
        this.ccpn.sendElement('getMarking');
    }

    updateMarking (socket, netMarking) {
        if (!netMarking.placeState || !Array.isArray(netMarking.placeState)) {
            return;
        }
        for (let i = 0; i < this.places.length; i++) {
            socket.emit('remove.label', {
                    parentId: this.places[i].id,
                    type: 'pt:marking',
            });
            if (netMarking.placeState[i].token) {
                socket.emit('create.label', {
                    parentId: this.places[i].id,
                    text: netMarking.placeState[i].token,
                    type: 'pt:marking',
                });
            }
        }
    }

}

module.exports = new CCPNSimulatorPlugin();
