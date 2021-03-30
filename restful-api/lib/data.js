/*
*   Library to store n editing data
*/

// dependencies
const fs = require('fs');
const path = require('path');

const helpers = require('./helpers');

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
    try {
        const fileContent = fs.readFileSync(lib.baseDir + '/' + dir + '/' + file + '.json', 'utf-8');

        return helpers.parseJsonToObject(fileContent);    
    } catch (error) {
        console.error(error);

        return null;
    }
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

// detele a file
lib.delete = (dir, file) => {
    fs.unlinkSync(lib.baseDir + '/' + dir + '/' + file + '.json');
};

// list all the items in a directory
lib.list = (dir) => {
    const fileNames = fs.readdirSync(lib.baseDir + '/' + dir);

    let trimmedFileNames = fileNames.map(fileName => fileName.replace('.json', ''));

    return trimmedFileNames;
};
 
// export the module
module.exports = lib;