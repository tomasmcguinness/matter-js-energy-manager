import { Environment, StorageService } from "@matter/main";
import { CommissioningController } from "@project-chip/matter.js";
import express from "express";
import http from "http"
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3001",
        methods: ["GET", "POST"]
    }
});

app.get("/status", (request, response) => {
    const status = {
        "Status": "Running"
    };

    response.send(status);
});

io.on('connection', (socket) => {
    console.log('a user connected');
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("Server Listening on PORT:", PORT);
});

/*
 * Stand up the Matter Controller
 */
// const environment = Environment.default;

// const storageService = environment.get(StorageService);

// const uniqueId = "EnergyManager";

// const adminFabricLabel = "matter.js Controller";

// const commissioningController = new CommissioningController({
//     environment: {
//         environment,
//         id: uniqueId,
//     },
//     autoConnect: false, // Do not auto connect to the commissioned nodes
//     adminFabricLabel,
// });

//const controllerStorage = (await storageService.open("controller")).createContext("data");

//await controllerStorage.set("fabriclabel", adminFabricLabel);

//console.log(`Starting controller...`);

// await commissioningController.start();

// let nodes = await commissioningController.getCommissionedNodes();

// nodes.forEach(async (nodeId) => {
//     const node = await commissioningController.getNode(nodeId);

//     // node.events.attributeChanged.on(({ path: { nodeId, clusterId, endpointId, attributeName }, value }) =>
//     //     console.log(
//     //         `attributeChangedCallback ${nodeId}: Attribute ${endpointId}/${clusterId}/${attributeName} changed to ${Diagnostic.json(
//     //             value,
//     //         )}`,
//     //     ),
//     // );

//     if (!node.isConnected) {
//         node.connect();
//     }

//     node.events.stateChanged.on(async (info) => {
//         switch (info) {
//             case NodeStates.Connected:
//                 console.log(`state changed: Node ${nodeId} connected!`);

//                 io.emit("status", nodeId.toString());

//                 const devices = node.getDevices();

//                 // TODO Find the DeviceEnergyManagement dynamically cluster
//                 // If a device even has one.
//                 //
//                 if (devices[1] && devices[1].number === 2) {

//                     console.log('Attempting to subscribe to the forecast');

//                     const deviceEnergyManagement = devices[1].getClusterClient(DeviceEnergyManagement.Complete);

//                     if (deviceEnergyManagement) {

//                         let forecast = await deviceEnergyManagement.getForecastAttribute();

//                         console.log({ forecast });

//                         energyManager.processForecast(nodeId, forecast);

//                         //                                io.emit("forecast", forecast);

//                         console.log('Subscribing to the forecast...');

//                         deviceEnergyManagement.addForecastAttributeListener(value => {
//                             console.log("Forecast Updated", value);
//                             //io.emit("forecast", value);
//                         });

//                     } else {
//                         console.error('No cluster client...');
//                     }
//                 }

//                 break;
//             case NodeStates.Disconnected:
//                 console.log(`state changed: Node ${nodeId} disconnected`);
//                 io.emit("status", nodeId.toString());
//                 break;
//             case NodeStates.Reconnecting:
//                 console.log(`state changed: Node ${nodeId} reconnecting`);
//                 io.emit("status", nodeId.toString());
//                 break;
//             case NodeStates.WaitingForDeviceDiscovery:
//                 console.log(`state changed: Node ${nodeId} waiting for device discovery`);
//                 io.emit("status", nodeId.toString());
//                 break;
//         }
//     });
// });

// console.log(`Commissioning controller started with id ${uniqueId} and label "${adminFabricLabel}"`);

app.get("/devices", async (request, response) => {

    const nodeDetails = commissioningController.getCommissionedNodes();

    let mapResult = nodeDetails.map(async (nodeId) => {
        const node = await commissioningController.getNode(nodeId);
        return { id: nodeId.toString(), state: node.state, manufacturer: node?.basicInformation?.manufacturerName?.toString() }
    });

    const devices = await Promise.all(mapResult);

    response.send(devices);
});

app.get("/optimise", async (request, response) => {
    response.send({});
});

// let forecast = {
//     slots: [{ nominalPower: 3000, duration: 30 }, { nominalPower: 1000, duration: 60 }, { nominalPower: 1500, duration: 30 }]
// };

let forecast = {
    // Basic forecast: 3kW nominal consumption for 2 hours
    //
    slots: [{ nominalPower: 3000, duration: 120 }]
};
let tariff = [28, 28, 7.5, 7.5, 7.5, 7.5, 28, 28];

app.get("/tariff", async (request, response) => {
    response.send(tariff);
})

app.post("/optimise", async (request, response) => {

    // TODO The routine to perform the optimization based on the current 
    // forecasts.

    // Ideas:
    // Do minute by minute?
    // Use costs as the signal of efficiency.
    // Test the cost of the forecast by simulating

    //var currentTime = new Date().getTime();

    // Turn tariff into a timeseries.
    //
    let tariffTimeSeries = tariff.reduce((accumulator, currentValue) => {

        for (var i = 0; i < 30; i++) {
            accumulator.push(currentValue);
        }

        return accumulator;
    }, []);

    let dishwasherTimeSeries = forecast.slots.reduce((accumulator, currentValue) => {

        for (var i = 0; i < currentValue.duration; i++) {
            accumulator.push(currentValue.nominalPower);
        }

        return accumulator;
    }, []);

    // Don't delay by more than four hours?
    //
    for (var simulationNumber = 0; simulationNumber < 120; simulationNumber++) {

        // Calculate the cost of the running the dishwasher at this specific offset.
        //
        var totalCostInPennies = dishwasherTimeSeries.reduce((accumulator, power, index) => {

            // Get the price.
            //
            var currentUnitPrice = tariffTimeSeries[index + simulationNumber];

            // Each tick is one minute. 
            //
            let powerInKiloWatt = power / 1000;
            let price = (powerInKiloWatt / 60) * currentUnitPrice;

            return accumulator + price;
        }, 0);


        console.log(`[${simulationNumber}] Total Cost: ${Math.floor(totalCostInPennies)}p`);
    }


    // let tariffTimeSeries = tariff.map(t => {
    //     // Each block lasts 30 minutes.
    //     //
    // })

    response.send({});
});