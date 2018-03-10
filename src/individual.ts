import { connectToRobot } from "./riolog/rioconnector";
//let log = require('why-is-node-running');


let connector = connectToRobot(1741, 9999, 1000);
connector.then((s) => {
    console.log('finished');
    if (s === undefined) {
        return;
    }
    console.log('got good socket');
    s.end();
    s.destroy();
    //log();
});


