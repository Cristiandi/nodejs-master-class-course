// dependencies: vm
const vm = require('vm');

// define a context for the vm module
const context = {
    foo: 25,
};

// define the script to be run
const script = new vm.Script(`

    foo = foo * 2;
    var bar = foo + 1;
    var fizz = 52;

`);

// run the script
script.runInNewContext(context);

console.log(context);