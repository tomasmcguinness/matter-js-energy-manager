import { Environment, StorageService } from "@matter/main";
import { CommissioningController } from "@project-chip/matter.js";
import { ManualPairingCodeCodec } from "@matter/main/types";
import express from "express";
import http, { get } from "http"
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

let tariffStructure = [
    { hour: 0, startMinute: 0, endMinute: 29, price: 7.5 },
    { hour: 0, startMinute: 30, endMinute: 59, price: 7.5 },
    // { hour: 1, startMinute: 0, endMinute: 29, price: 7.5 },
    // { hour: 1, startMinute: 30, endMinute: 59, price: 7.5 },
    // { hour: 2, startMinute: 0, endMinute: 29, price: 7.5 },
    // { hour: 2, startMinute: 30, endMinute: 59, price: 7.5 },
    // { hour: 3, startMinute: 0, endMinute: 29, price: 7.5 },
    // { hour: 3, startMinute: 30, endMinute: 59, price: 7.5 },
    // { hour: 4, startMinute: 0, endMinute: 29, price: 7.5 },
    // { hour: 4, startMinute: 30, endMinute: 59, price: 7.5 },
    // { hour: 5, startMinute: 0, endMinute: 29, price: 7.5 },
    { hour: 23, startMinute: 0, endMinute: 29, price: 7.5 },
    { hour: 13, startMinute: 0, endMinute: 29, price: 7.5 },
    { hour: 14, startMinute: 0, endMinute: 29, price: 7.5 },
];

const generateTariff = (currentTime) => {
    let tariffSlots = [];

    let projectionLengthInSeconds = 24 * 60 * 60;

    // Using the current time, generate slots for each second.
    //
    let now = Math.floor(currentTime / 1000);
    let max = now + projectionLengthInSeconds;

    // Process each second for the next 12 hours.
    // Group into slots
    //
    var lastSlotType;
    var lastDuration = 0;

    var totalMinutesProcessed = 0;
    for (var i = now; i < max; i++) {

        totalMinutesProcessed++;

        let date = new Date(Math.floor(i * 1000));

        let hour = date.getHours();
        let minute = date.getMinutes();

        let offpeakSlots = tariffStructure.filter(slot => slot.hour === hour && minute >= slot.startMinute && minute <= slot.endMinute);

        let currentSlotType = offpeakSlots.length > 0 ? 'offpeak' : 'peak';

        if (lastDuration == 0) {
            lastSlotType = currentSlotType;
            lastDuration++;
        }

        // If we're still in the same slot type, increment the duration.
        //
        if (currentSlotType == lastSlotType) {
            lastDuration++;
        }
        else {
            tariffSlots.push({ type: lastSlotType, price: lastSlotType == 'offpeak' ? 7.5 : 28, duration: lastDuration });
            lastDuration = 0;
        }
    }

    if (totalMinutesProcessed != projectionLengthInSeconds) {
        console.error("Tariff length is not the expected value. Something went wrong!");
    }

    return tariffSlots;
}

app.get("/tariff", async (request, response) => {
    var tariff = generateTariff(Date.now());
    response.send(tariff);
});

const getForecast = async () => {

    // let startDelayInMinutes = 0;
    // let durationInMinutes = 90;

    // let currentTime = Math.round(Date.now() / 1000);

    // All matter times are in seconds since epoch and durations are in seconds.
    //
    // let forecast = {
    //     startTime: currentTime + (startDelayInMinutes * 60),
    //     endTime: currentTime + (startDelayInMinutes * 60) + (durationInMinutes * 60),
    //     slots: [{ nominalPower: 3000, duration: durationInMinutes * 60 }]
    // };

    // console.log({ forecast });

    // Fetch the current forecast from the device.
    //
    const nodeDetails = await commissioningController.getCommissionedNodes();

    console.log({ nodeDetails });

    const nodeId = nodeDetails[1];

    let node = await commissioningController.getNode(nodeId);

    const devices = node.getDevices();

    console.log({ devices });

    var forecast = null;

    if (devices[1] && devices[1].number === 2) {

        const deviceEnergyManagement = devices[1].getClusterClient(DeviceEnergyManagement.Complete);

        console.log({ deviceEnergyManagement });

        if (deviceEnergyManagement) {
            forecast = await deviceEnergyManagement.getForecastAttribute();
        }
    }

    return forecast;
}

app.get("/forecast", async (request, response) => {

    let forecast = await getForecast();

    if (forecast !== null) {
        console.log({ forecast });
        response.send(forecast);
    } else {
        console.log('Return 204');
        response.status(204).send();
    }

    return;
})

app.post("/optimise", async (request, response) => {

    // TODO The routine to perform the optimization based on the current 
    // forecasts.

    // Ideas:
    // Do minute by minute?
    // Use costs as the signal of efficiency.
    // Test the cost of the forecast by simulating

    // Based on the current time, generate a tariff.
    //
    var currentTime = Date.now();

    var tariffSlots = generateTariff(currentTime);

    console.log({ tariffSlots });

    var forecast = await getForecast();

    console.log({ forecast });

    // Turn tariff into a timeseries.
    //
    let tariffTimeSeries = tariffSlots.reduce((accumulator, tariffSlot) => {

        for (var i = 0; i < tariffSlot.duration; i++) {
            accumulator.push(tariffSlot.price);
        }

        return accumulator;
    }, []);

    console.log({ tariffTimeSeries });

    // Turn forecast into a timeseries.
    //
    let startTime = forecast.startTime; // Seconds.

    let dishwasherTimeSeries = forecast.slots.reduce((accumulator, currentValue) => {

        for (var i = 0; i < currentValue.duration; i++) {
            accumulator.push(currentValue.nominalPower);
        }

        return accumulator;
    }, []);

    console.log({ dishwasherTimeSeries });

    let simulationOutcomes = [];
    let maximumSimulationDelayInHours = 10
    let simulationLengthInSeconds = maximumSimulationDelayInHours * 60 * 60;

    for (var simulationNumber = 0; simulationNumber < simulationLengthInSeconds; simulationNumber++) {

        // Calculate the cost of the running the dishwasher at this specific offset.
        // TODO Take earlistStartTime into account.
        //
        var totalCostInPennies = dishwasherTimeSeries.reduce((accumulator, power, index) => {

            var tariffPrice = tariffTimeSeries[index + simulationNumber];

            let powerInKiloWatt = power / 1000;
            let price = (powerInKiloWatt / 60 / 60) * tariffPrice;

            return accumulator + price;

        }, 0);

        simulationOutcomes.push({ delay: simulationNumber, totalCost: Math.floor(totalCostInPennies) });

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
    forecast.startTime = forecast.startTime + cheapestSimulation.delay;

    io.emit("forecast", forecast);

    response.send(simulationOutcomes);
});