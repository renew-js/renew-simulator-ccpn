const spawn = require('child_process').spawn;

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

}

module.exports = CCPNProcess;
