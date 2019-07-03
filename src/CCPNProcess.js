const spawn = require('child_process').spawn;
const builder = require('xmlbuilder');

class CCPNProcess {

    constructor () {
        this.process = spawn('ccpn');
        this.process.stdin.setEncoding('utf-8');
        this.process.stderr.on('data', (data) => {
            process.stderr.write(data);
        });
    }

    write (data) {
        this.process.stdin.write(data);
    }

    read (callback) {
        this.process.stdout.on('data', callback);
    }

    sendElement (element) {
        if (typeof element === 'string') {
            element = builder.create(element);
        }

        this.write(element.end());
    }

}

module.exports = CCPNProcess;
