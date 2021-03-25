/*
*   Library to store n editing data
*/

// dependencies
const fs = require('fs');
const path = require('path');

// container for the module
const lib = {};

// base directory of the data folder
lib.baseDir = path.join(__dirname, '../.data');

// write data to a file
lib.create = (dir, file, data) => {
    // open the file
    const fileDescriptor = fs.openSync(lib.baseDir + '/' + dir + '/' + file + '.json', 'wx');

    // convert the data to string
    const stringData = JSON.stringify(data);

    // write to file and close it
    try {
        fs.writeFileSync(fileDescriptor, stringData);
    } finally {
        fs.closeSync(fileDescriptor);   
    }
};

// read data from a file
lib.read = (dir, file) => {
    const fileContent = fs.readFileSync(lib.baseDir + '/' + dir + '/' + file + '.json', 'utf-8');

    return fileContent;
};

// update data in a file
lib.update = (dir, file, data) => {
    // open the file
    const fileDescriptor = fs.openSync(lib.baseDir + '/' + dir + '/' + file + '.json', 'r+');

    // truncate the file
    fs.ftruncateSync(fileDescriptor);

    // convert the data to string
    const stringData = JSON.stringify(data);

    // write to file and close it
    try {
        fs.writeFileSync(fileDescriptor, stringData);
    } finally {
        fs.closeSync(fileDescriptor);   
    }
}
lib.delete = (dir, file) => {
    fs.unlinkSync(lib.baseDir + '/' + dir + '/' + file + '.json');
};
 
// export the module
module.exports = lib;