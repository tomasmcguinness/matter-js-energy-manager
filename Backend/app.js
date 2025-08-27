import { Environment, StorageService } from "@matter/main";
import { CommissioningController } from "@project-chip/matter.js";
import { ManualPairingCodeCodec } from "@matter/main/types";
import express from "express";
import http from "http"
import { Server } from "socket.io";
import cors from "cors";
import { Diagnostic, NodeId } from "@matter/main";
import { GeneralCommissioning } from "@matter/main/clusters";
import { DeviceEnergyManagement } from "@matter/main/clusters";
import { NodeStates } from "@project-chip/matter.js/device";

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
const environment = Environment.default;

const storageService = environment.get(StorageService);

const uniqueId = "EnergyManager";

const adminFabricLabel = "matter.js Controller";

const commissioningController = new CommissioningController({
    environment: {
        environment,
        id: uniqueId,
    },
    autoConnect: false, // Do not auto connect to the commissioned nodes
    adminFabricLabel,
});

const controllerStorage = (await storageService.open("controller")).createContext("data");

await controllerStorage.set("fabriclabel", adminFabricLabel);

console.log(`Starting controller...`);

await commissioningController.start();

let nodes = await commissioningController.getCommissionedNodes();

nodes.forEach(async (nodeId) => {
    const node = await commissioningController.getNode(nodeId);

    node.events.attributeChanged.on(({ path: { nodeId, clusterId, endpointId, attributeName }, value }) =>
        console.log(
            `attributeChangedCallback ${nodeId}: Attribute ${endpointId}/${clusterId}/${attributeName} changed to ${Diagnostic.json(
                value,
            )}`,
        ),
    );

    if (!node.isConnected) {
        node.connect();
    }

    node.events.stateChanged.on(async (info) => {
        switch (info) {
            case NodeStates.Connected:
                console.log(`state changed: Node ${nodeId} connected!`);

                //                 io.emit("status", nodeId.toString());

                const devices = node.getDevices();

                //                 // TODO Find the DeviceEnergyManagement dynamically cluster
                //                 // If a device even has one.
                //                 //
                if (devices[1] && devices[1].number === 2) {

                    console.log('Attempting to subscribe to the forecast');

                    const deviceEnergyManagement = devices[1].getClusterClient(DeviceEnergyManagement.Complete);

                    if (deviceEnergyManagement) {

                        //                       let forecast = await deviceEnergyManagement.getForecastAttribute();

                        //                         console.log({ forecast });

                        //                         energyManager.processForecast(nodeId, forecast);

                        //                         //                                io.emit("forecast", forecast);

                        //                         console.log('Subscribing to the forecast...');

                        deviceEnergyManagement.addForecastAttributeListener(value => {
                            console.log("Forecast Updated", value);
                            io.emit("forecast", value);
                        });

                    } else {
                        console.error('No cluster client...');
                    }
                }

                break;
            case NodeStates.Disconnected:
                console.log(`state changed: Node ${nodeId} disconnected`);
                io.emit("status", nodeId.toString());
                break;
            case NodeStates.Reconnecting:
                console.log(`state changed: Node ${nodeId} reconnecting`);
                io.emit("status", nodeId.toString());
                break;
            case NodeStates.WaitingForDeviceDiscovery:
                console.log(`state changed: Node ${nodeId} waiting for device discovery`);
                io.emit("status", nodeId.toString());
                break;
        }
    });
});

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

app.get("/devices/:nodeId", async (request, response) => {

    const { nodeId } = request.params;

    const node = await commissioningController.getNode(NodeId(nodeId));

    response.send({
        id: nodeId.toString(),
        state: node.state,
        manufacturer: node?.basicInformation?.manufacturerName?.toString(),
        devices: node.getDevices().map(device => ({ id: device.id, name: device.name, number: device.number }))
    });
});

app.post("/devices", async (request, response) => {

    let data = request.body;

    let setupPin, shortDiscriminator;

    const pairingCodeCodec = ManualPairingCodeCodec.decode(data.manualSetupCode);
    shortDiscriminator = pairingCodeCodec.shortDiscriminator;
    setupPin = pairingCodeCodec.passcode;

    console.log(`Data extracted from pairing code: ${Diagnostic.json(pairingCodeCodec)}`);

    const commissioningOptions = {
        regulatoryLocation: GeneralCommissioning.RegulatoryLocationType.IndoorOutdoor,
        regulatoryCountryCode: "XX",
    };

    const options = {
        commissioning: commissioningOptions,
        discovery: {
            identifierData: { shortDiscriminator }
        },
        passcode: setupPin,
    };

    console.log(`Commissioning ... ${Diagnostic.json(options)}`);

    const nodeId = await commissioningController.commissionNode(options);

    console.log(`Commissioning successfully done with nodeId ${nodeId}`);

    return new Response("data", { status: 200 })
});

app.delete("/devices/:nodeId", async (request, response) => {

    const { nodeId } = request.params;

    let node = await commissioningController.getNode(NodeId(nodeId));

    await node.decommission();

    response.status(204).send();
});

// var forecast = {
//     // Basic forecast: 3kW nominal consumption for 2 hours
//     //
//     startTime: Date.now(),
//     slots: [{ nominalPower: 3000, duration: 120 }]
// };

//let tariff =  [28, 28, 7.5, 7.5, 7.5, 7.5, 28, 28];

let tariffStructure = [
    { hour: 0, startMinute: 0, endMinute: 29, price: 7.5 },
    { hour: 0, startMinute: 30, endMinute: 59, price: 7.5 },
    { hour: 1, startMinute: 0, endMinute: 29, price: 7.5 },
    { hour: 1, startMinute: 30, endMinute: 59, price: 7.5 },
    { hour: 2, startMinute: 0, endMinute: 29, price: 7.5 },
    { hour: 2, startMinute: 30, endMinute: 59, price: 7.5 },
    { hour: 3, startMinute: 0, endMinute: 29, price: 7.5 },
    { hour: 3, startMinute: 30, endMinute: 59, price: 7.5 },
    { hour: 4, startMinute: 0, endMinute: 29, price: 7.5 },
    { hour: 4, startMinute: 30, endMinute: 59, price: 7.5 },
    { hour: 5, startMinute: 0, endMinute: 29, price: 7.5 },
    { hour: 23, startMinute: 30, endMinute: 59, price: 7.5 },
    { hour: 11, startMinute: 0, endMinute: 59, price: 7.5 },
];

app.get("/tariff", async (request, response) => {

    let tariff = [];

    // Using the current time, generate slots.
    //
    let now = Date.now();
    let max = now + (1 * 60 * 60); // Twelve hours

    // Process each minute for the next 12 hours.
    //
    for (var i = now; i < max; i++) {
        let date = new Date(i);

        let hour = date.getHours();
        let minute = date.getMinutes();

        let offpeakSlots = tariffStructure.filter(slot => slot.hour === hour);// && minute >= slot.startMinute && minute <= slot.endMinute);

        if (offpeakSlots.length > 0) {
            //console.log("Found an offpeak slot", { hour, minute, offpeakSlots });
            tariff.push({ time: i, price: 7.5 });
        } else {
            tariff.push({ time: i, price: 28 });
        }
    }

    response.send(tariff);
})

app.get("/forecast", async (request, response) => {

    let forecast = {
        // Basic forecast: 3kW nominal consumption for 2 hours
        //
        startTime: Date.now() + (15 * 60 * 1000), // Start in 15 minutes
        endTime: Date.now() + (105 * 60 * 1000), // End in 105 minutes (90 minutes after start)
        slots: [{ nominalPower: 3000, duration: 120 }]
    };

    console.log({forecast});

    response.send(forecast);

    return;

    // Fetch the current forecast from the device.
    //
    const nodeDetails = await commissioningController.getCommissionedNodes();

    console.log({ nodeDetails });

    const nodeId = nodeDetails[0];

    let node = await commissioningController.getNode(nodeId);

    const devices = node.getDevices();

    console.log({ devices });

    if (devices[1] && devices[1].number === 2) {

        const deviceEnergyManagement = devices[1].getClusterClient(DeviceEnergyManagement.Complete);

        console.log({ deviceEnergyManagement });

        if (deviceEnergyManagement) {

            let forecast = await deviceEnergyManagement.getForecastAttribute();
            console.log({ forecast });

            if (forecast && forecast.endTime > Date.now()) {
                response.send(forecast);
            } else {
                response.status(204).send();
            }
        }
        else {
            response.status(204).send();
        }
    } else {
        response.status(204).send();
    }
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

    let simulationOutcomes = [];

    // Don't delay by more than four hours?
    //
    for (var simulationNumber = 0; simulationNumber < 120; simulationNumber++) {

        // Calculate the cost of the running the dishwasher at this specific offset.
        //
        var totalCostInPennies = dishwasherTimeSeries.reduce((accumulator, power, index) => {

            // Get the price, offseting by one minute for each simulator.
            //
            var currentUnitPrice = tariffTimeSeries[index + simulationNumber];

            // Each tick is one minute. 
            //
            let powerInKiloWatt = power / 1000;
            let price = (powerInKiloWatt / 60) * currentUnitPrice;

            return accumulator + price;
        }, 0);

        simulationOutcomes.push({ id: simulationNumber, totalCost: Math.floor(totalCostInPennies) });

        //console.log(`[${simulationNumber}] Total Cost: ${Math.floor(totalCostInPennies)}p`);
    }

    // Based on the cheapest simulation, perform the actions
    //
    let cheapestSimulation = simulationOutcomes.reduce((min, obj) => {
        return min.totalCost < obj.totalCost ? min : obj;
    });

    console.log({ cheapestSimulation });

    // TODO Send a delayed start command to the device.
    // For now, adjust the forecast.
    //
    forecast.startTime = cheapestSimulation.id;

    io.emit("forecast", forecast);

    response.send(simulationOutcomes);
});