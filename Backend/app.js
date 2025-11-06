import { Environment, StorageService } from "@matter/main";
import { CommissioningController } from "@project-chip/matter.js";
import { ManualPairingCodeCodec } from "@matter/main/types";
import express from "express";
import http, { get } from "http"
import { Server } from "socket.io";
import cors from "cors";
import { Diagnostic, NodeId } from "@matter/main";
import { DishwasherMode, GeneralCommissioning, OperationalState } from "@matter/main/clusters";
import { DeviceEnergyManagement, DescriptorCluster } from "@matter/main/clusters";
import { NodeStates } from "@project-chip/matter.js/device";

const app = express();
app.use(express.json());
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:4001",
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

const PORT = process.env.PORT || 4000;

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

    node.events.attributeChanged.on(({ path: { nodeId, clusterId, endpointId, attributeName }, value }) => {

         console.log({clusterId});

        if (clusterId === OperationalState.id) {
            io.emit("operationalState", value);
        }

        if (clusterId === 0x98) {
            console.log({attributeName});

            if(attributeName === "optOutState") {
                io.emit("optOutState", value);
            }
        }

        // console.log(
        //     `attributeChangedCallback ${nodeId}: Attribute ${endpointId}/${clusterId}/${attributeName} changed to ${Diagnostic.json(
        //         value,
        //     )}`,
        // ),
    });

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

                            if (value.startTime === 0) {
                                console.log('Ignoring empty forecast');
                                io.emit("forecast", null);
                            } else {
                                io.emit("forecast", value);
                            }
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

        var endpoint = node.getRootEndpoint();

        const descriptorCluster = endpoint.getClusterClient(DescriptorCluster);

        // Invoke the getPartsListAttribute function
        const partsList = await descriptorCluster.getPartsListAttribute();

        // var deviceTypes = [];

        // await partsList.forEach(async (endpointId) => {
        //     const endpoint = node.getDeviceById(endpointId); // Replace with actual ID

        //     // Get the Descriptor cluster client
        //     const descriptorCluster = endpoint.getClusterClient(DescriptorCluster);

        //     // Retrieve the device type list
        //     const deviceTypeList = await descriptorCluster.getDeviceTypeListAttribute();

        //     for (const deviceType of deviceTypeList) {
        //         console.log(`Device Type ID: ${deviceType.deviceType}`);
        //         console.log(`Revision: ${deviceType.revision}`);

        //         deviceTypes.push(deviceType.deviceType)
        //     }
        // });

        // var deviceTypes = await partsList.reduce(async (accumulator, endpointId) => {

        //     console.log({ accumulator});

        //     const endpoint = node.getDeviceById(endpointId); // Replace with actual ID

        //     // Get the Descriptor cluster client
        //     const descriptorCluster = endpoint.getClusterClient(DescriptorCluster);

        //     // Retrieve the device type list
        //     const deviceTypeList = await descriptorCluster.getDeviceTypeListAttribute();

        //     for (const deviceType of deviceTypeList) {
        //         console.log(`Device Type ID: ${deviceType.deviceType}`);
        //         console.log(`Revision: ${deviceType.revision}`);

        //         accumulator.concat(deviceType.deviceType)
        //     }

        // }, []);

        var deviceTypes = [];

        for (const endpointId of partsList) {
            const endpoint = node.getDeviceById(endpointId); 

            // Get the Descriptor cluster client
            const descriptorCluster = endpoint.getClusterClient(DescriptorCluster);

            // Retrieve the device type list
            const deviceTypeList = await descriptorCluster.getDeviceTypeListAttribute();

            for (const deviceType of deviceTypeList) {
                console.log(`Device Type ID: ${deviceType.deviceType}`);
                console.log(`Revision: ${deviceType.revision}`);

                deviceTypes.push(deviceType.deviceType)
            }
        }

        console.log({ deviceTypes });

        return { id: nodeId.toString(), state: node.state, manufacturer: node?.basicInformation?.manufacturerName?.toString(), deviceTypes }
    });

    const devices = await Promise.all(mapResult);

    response.send(devices);
});

app.get("/devices/:nodeId", async (request, response) => {

    const { nodeId } = request.params;

    const node = await commissioningController.getNode(NodeId(nodeId));

    const devices = node.getDevices();

    console.log(devices[0]);

    //const operationalStateCluster = node.getDevices()[0].getClusterClient(OperationalState.Complete);
    //const dishwasherModeCluster = node.getDevices()[0].getClusterClient(DishwasherMode.Complete);
    //const deviceEnergyManagementCluster = node.getDevices()[1].getClusterClient(DeviceEnergyManagement.Complete);

    //var operationState = await operationalStateCluster.getOperationalStateAttribute();
    //var dishwasherMode = await dishwasherModeCluster.getCurrentModeAttribute();
    //var optOut = await deviceEnergyManagementCluster.getOptOutStateAttribute();

    response.send({
        id: nodeId.toString(),
        state: node.state,
        manufacturer: node?.basicInformation?.manufacturerName?.toString(),
        //currentState: operationState,
        //currentMode: dishwasherMode,
        //optOut: optOut,
        //devices: node.getDevices().map(device => ({ id: device.id, name: device.name, number: device.number }))
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
    { hour: 1, startMinute: 0, endMinute: 29, price: 7.5 },
    { hour: 1, startMinute: 30, endMinute: 59, price: 7.5 },
    { hour: 2, startMinute: 0, endMinute: 29, price: 7.5 },
    { hour: 2, startMinute: 30, endMinute: 59, price: 7.5 },
    { hour: 3, startMinute: 0, endMinute: 29, price: 7.5 },
    { hour: 3, startMinute: 30, endMinute: 59, price: 7.5 },
    { hour: 4, startMinute: 0, endMinute: 29, price: 7.5 },
    { hour: 4, startMinute: 30, endMinute: 59, price: 7.5 },
    { hour: 5, startMinute: 0, endMinute: 29, price: 7.5 },
    { hour: 5, startMinute: 30, endMinute: 59, price: 28 },
    { hour: 6, startMinute: 0, endMinute: 29, price: 28 },
    { hour: 6, startMinute: 30, endMinute: 59, price: 28 },
    { hour: 7, startMinute: 0, endMinute: 29, price: 28 },
    { hour: 7, startMinute: 30, endMinute: 59, price: 28 },
    { hour: 8, startMinute: 0, endMinute: 29, price: 28 },
    { hour: 8, startMinute: 30, endMinute: 59, price: 28 },
    { hour: 9, startMinute: 0, endMinute: 29, price: 28 },
    { hour: 9, startMinute: 30, endMinute: 59, price: 28 },
    { hour: 10, startMinute: 0, endMinute: 29, price: 28 },
    { hour: 10, startMinute: 30, endMinute: 59, price: 28 },
    { hour: 11, startMinute: 0, endMinute: 29, price: 28 },
    { hour: 11, startMinute: 30, endMinute: 59, price: 28 },
    { hour: 12, startMinute: 0, endMinute: 29, price: 28 },
    { hour: 12, startMinute: 30, endMinute: 59, price: 28 },
    { hour: 13, startMinute: 0, endMinute: 29, price: 28 },
    { hour: 13, startMinute: 30, endMinute: 59, price: 28 },
    { hour: 14, startMinute: 0, endMinute: 29, price: 28 },
    { hour: 14, startMinute: 30, endMinute: 59, price: 28 },
    { hour: 15, startMinute: 0, endMinute: 29, price: 28 },
    { hour: 15, startMinute: 30, endMinute: 59, price: 28 },
    { hour: 16, startMinute: 0, endMinute: 29, price: 28 },
    { hour: 16, startMinute: 30, endMinute: 59, price: 28 },
    { hour: 17, startMinute: 0, endMinute: 29, price: 28 },
    { hour: 17, startMinute: 30, endMinute: 59, price: 28 },
    { hour: 18, startMinute: 0, endMinute: 29, price: 28 },
    { hour: 18, startMinute: 30, endMinute: 59, price: 28 },
    { hour: 19, startMinute: 0, endMinute: 29, price: 28 },
    { hour: 19, startMinute: 30, endMinute: 59, price: 28 },
    { hour: 20, startMinute: 0, endMinute: 29, price: 28 },
    { hour: 20, startMinute: 30, endMinute: 59, price: 28 },
    { hour: 21, startMinute: 0, endMinute: 29, price: 28 },
    { hour: 21, startMinute: 30, endMinute: 59, price: 28 },
    { hour: 22, startMinute: 0, endMinute: 29, price: 28 },
    { hour: 22, startMinute: 30, endMinute: 59, price: 28 },
    { hour: 23, startMinute: 0, endMinute: 29, price: 28 },
    { hour: 23, startMinute: 30, endMinute: 59, price: 7.5 },
];

const generateTariff = (currentTime) => {
    let tariffSlots = [];

    let projectionLengthInSeconds = 24 * 60 * 60;

    // Using the current time, generate slots for each second.
    //
    let now = currentTime;
    let max = now + projectionLengthInSeconds;

    // Process each second for the next 12 hours.
    // Group into slots
    //
    var lastSlotType;
    var lastDuration = 0;
    var startDate = now;

    var totalMinutesProcessed = 0;
    for (var i = now; i < max; i++) {

        totalMinutesProcessed++;

        let date = new Date(Math.floor(i * 1000));

        let hour = date.getHours();
        let minute = date.getMinutes();

        let slots = tariffStructure.filter(slot => slot.hour === hour && minute >= slot.startMinute && minute <= slot.endMinute);

        let currentSlotType = slots[0].price === 7.5 ? 'offpeak' : 'peak';

        if (lastDuration == 0) {
            startDate = date;
            lastSlotType = currentSlotType;
            lastDuration++;
        }

        // If we're still in the same slot type, increment the duration.
        //
        if (currentSlotType == lastSlotType) {
            lastDuration++;
        }
        else {
            tariffSlots.push({ startDate: startDate, type: lastSlotType, price: lastSlotType == 'offpeak' ? 7.5 : 28, duration: lastDuration });
            lastDuration = 0;
        }
    }

    tariffSlots.push({ startDate: startDate, type: lastSlotType, price: lastSlotType == 'offpeak' ? 7.5 : 28, duration: lastDuration });

    if (totalMinutesProcessed != projectionLengthInSeconds) {
        console.error("Tariff length is not the expected value. Something went wrong!");
    }

    return tariffSlots;
}

app.get("/tariff", async (request, response) => {
    var tariff = generateTariff(Math.floor(Date.now() / 1000));
    response.send(tariff);
});

app.get("/tariff/configuration", async (request, response) => {
    response.send(tariffStructure);
});

app.post("/tariff/configuration", async (request, response) => {
    console.log(request.query.id);

    tariffStructure[request.query.id].price = tariffStructure[request.query.id].price == 7.5 ? 28 : 7.5;

    response.status(204).send();
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

    const nodeId = nodeDetails[1];

    let node = await commissioningController.getNode(nodeId);

    const devices = node.getDevices();

    var forecast = null;

    if (devices[1] && devices[1].number === 2) {

        const deviceEnergyManagement = devices[1].getClusterClient(DeviceEnergyManagement.Complete);

        //console.log({ deviceEnergyManagement });

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

        if (forecast.startTime === 0) {
            response.status(204).send();
        } else {
            response.send(forecast);
        }
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
    var currentTime = Math.floor(Date.now() / 1000);

    var tariffSlots = generateTariff(currentTime);

    //console.log({ tariffSlots });

    var forecast = await getForecast();

    //console.log({ forecast });

    // Turn tariff into a timeseries.
    //
    let tariffTimeSeries = tariffSlots.reduce((accumulator, tariffSlot) => {

        for (var i = 0; i < tariffSlot.duration; i++) {
            accumulator.push(tariffSlot.price);
        }

        return accumulator;
    }, []);

    //console.log({ tariffTimeSeries });

    // Turn forecast into a timeseries.
    //
    let dishwasherTimeSeries = forecast.slots.reduce((accumulator, currentValue) => {

        for (var i = 0; i < currentValue.defaultDuration; i++) {
            accumulator.push(currentValue.nominalPower);
        }

        return accumulator;
    }, []);

    //console.log({ dishwasherTimeSeries });

    let simulationOutcomes = [];
    let maximumSimulationDelayInHours = 12;
    let simulationLengthInSeconds = maximumSimulationDelayInHours * 60 * 60;

    for (var simulationNumber = 0; simulationNumber < simulationLengthInSeconds; simulationNumber++) {

        // Calculate the cost of the running the dishwasher at this specific offset.
        // TODO Take earlistStartTime into account.
        //
        var totalCostInPennies = dishwasherTimeSeries.reduce((accumulator, power, index) => {
            var tariffPrice = tariffTimeSeries[index + simulationNumber];

            let powerInKiloWatt = power / 1000000; // convert from milliwatts to kilowatts (Matter uses milliwatts)
            let price = (powerInKiloWatt / 3600) * tariffPrice;

            //console.log({ powerInKiloWatt, price });

            return accumulator + price;
        }, 0);

        //console.log({ simulationNumber, totalCostInPennies });

        simulationOutcomes.push({ delay: simulationNumber, totalCost: Math.floor(totalCostInPennies) });

        //console.log(`[${simulationNumber}] Total Cost: ${Math.floor(totalCostInPennies)}p`);
    }

    // Based on the cheapest simulation, perform the actions
    //
    let cheapestSimulation = simulationOutcomes.reduce((min, obj) => {
        return min.totalCost <= obj.totalCost ? min : obj;
    });

    console.log({ cheapestSimulation });

    const nodeDetails = await commissioningController.getCommissionedNodes();

    const nodeId = nodeDetails[1];

    let node = await commissioningController.getNode(nodeId);

    const devices = node.getDevices();

    if (devices[1] && devices[1].number === 2) {

        const deviceEnergyManagement = devices[1].getClusterClient(DeviceEnergyManagement.Complete);

        let newStartTime = currentTime + cheapestSimulation.delay;

        await deviceEnergyManagement.startTimeAdjustRequest({
            requestedStartTime: newStartTime,
            cause: DeviceEnergyManagement.AdjustmentCause.LocalOptimization
        });

        forecast.startTime = newStartTime;

        io.emit("forecast", forecast);
    }

    response.send(simulationOutcomes);
});