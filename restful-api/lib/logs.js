/*
* Lib for storing logs
*/

// dependencies
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const lib = {};

lib.baseDir = path.join(__dirname, '../.logs');

lib.append = (fileName, str) => {
    // open the file
    const fileDescriptor = fs.openSync(lib.baseDir + '/' + fileName + '.log', 'a');

    // write to file and close it
    try {
        fs.appendFileSync(fileDescriptor, str + '\n');
    } finally {
        fs.closeSync(fileDescriptor);   
    }
};

// list all the logs and optionally list de compressed
lib.list = (includeCompressed = false) => {
    try {
        const fileNames = fs.readdirSync(lib.baseDir);

        const trimmedFileNames = fileNames.map(fileName => {
            // add the .log files
            if (fileName.includes('.log')) {
                return fileName.replace('.log', '');
            }

            // add the .gz.b64 files
            if (fileName.includes('.gz.b64') && includeCompressed) {
                return fileName.replace('.gz.b64', '');
            }
        }).filter(item => !!item);

        return trimmedFileNames;
    } catch (error) {
        console.error('error listing logs:', error);
        return [];
    }
};

// compres the log files
lib.compress = (logId, newLogId) => {
    const sourceFile = logId + '.log';

    const destinationFile = newLogId + '.gz.b64';

    const fileContent = fs.readFileSync(lib.baseDir + '/' + sourceFile, 'utf-8');

    // compress the data
    const buffer = zlib.gzipSync(fileContent);

    console.log(lib.baseDir + '/' + destinationFile);

    const fileDescriptor = fs.openSync(lib.baseDir + '/' + destinationFile, 'wx');

    fs.writeFileSync(fileDescriptor, buffer.toString('base64'));

    fs.closeSync(fileDescriptor);
};

// decompress
lib.decompress = (logId) => {
    const fileName = logId + '.gz.b64';

    const fileContent = fs.readFileSync(fileName, 'utf-8');

    const inputBuffer = Buffer.from(fileContent, 'base64');

    const outputBuffer = zlib.unzipSync(inputBuffer);

    const str = outputBuffer.toString();

    return str;
};


// tru
lib.truncate = (logId) => {
    fs.truncateSync(lib.baseDir + '/' + logId + '.log');
};

module.exports = lib;