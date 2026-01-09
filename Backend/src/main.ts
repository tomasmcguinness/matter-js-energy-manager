import express from "express";
import http from "http"
import cors from "cors";
import { Server } from "socket.io";
import { Environment, NodeId, Diagnostic, StorageService } from "@matter/main";
import { CommissioningController } from "@project-chip/matter.js";
import { ManualPairingCodeCodec } from "@matter/main/types";
import { GeneralCommissioning } from "@matter/main/clusters";
import { NodeStates } from "@project-chip/matter.js/device";
import { DeviceEnergyManagement, DescriptorCluster, BasicInformationCluster } from "@matter/main/clusters";
import { CommodityTariffCluster, } from "./clusters/CommodityTariffFunctionality.js";

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

nodes.forEach(async (nodeId: any) => {
    const node = await commissioningController.getNode(nodeId);

    // node.events.attributeChanged.on(({ path: { nodeId:any, clusterId:any, endpointId:any attributeName:any }, value:any }) => {

    //     console.log({ clusterId });

    //     // if (clusterId === OperationalState.id) {
    //     //     io.emit("operationalState", value);
    //     // }

    //     if (clusterId === 0x98) {
    //         console.log({ attributeName });

    //         if (attributeName === "optOutState") {
    //             io.emit("optOutState", value);
    //         }
    //     }

    //     console.log(`attributeChangedCallback ${nodeId}: Attribute ${endpointId}/${clusterId}/${attributeName} changed to ${Diagnostic.json(value)}`);
    // });

    if (!node.isConnected) {
        node.connect();
    }

    node.events.stateChanged.on(async (info) => {
        switch (info) {
            case NodeStates.Connected:
                console.log(`state changed: Node ${nodeId} connected!`);

                var endpoint = node.getDeviceById(1);

                // TODO Find the DeviceEnergyManagement dynamically cluster
                // If a device even has one.
                //
                if (endpoint) {

                    console.log('Attempting to subscribe to the forecast of nodes with a DEM cluster');

                    const deviceEnergyManagement = endpoint.getClusterClient(DeviceEnergyManagement.Complete);

                    if (deviceEnergyManagement) {

                        deviceEnergyManagement.addForecastAttributeListener(value => {
                            console.log("Forecast Updated", value);

                            if (value) {
                                io.emit("forecast", value);
                            } else {
                                io.emit("forecast", null);
                            }
                        });

                    } else {
                        console.error('No cluster client available for the DeviceEnergyManager...');
                    }

                    const commodityTariffCluster = endpoint.getClusterClient(CommodityTariffCluster);

                    if (commodityTariffCluster) {
                        console.log('Found a CommodityTariff Cluster');
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

app.get("/devices", async (request, response) => {

    console.log('/devices');

    const nodeDetails = commissioningController.getCommissionedNodes();

    let mapResult = nodeDetails.map(async (nodeId) => {

        console.log(`Processing node ${nodeId}`);

        const node = await commissioningController.getNode(nodeId);

        const basicInformationCluster = node.getRootClusterClient(BasicInformationCluster);

        var productName = await basicInformationCluster?.getProductNameAttribute();
        var vendorName = await basicInformationCluster?.getVendorNameAttribute();

        var deviceTypes = [];

        const descriptorCluster = node.getRootClusterClient(DescriptorCluster);

        if (descriptorCluster) {

            const partsList = await descriptorCluster.getPartsListAttribute();

            console.log(`Processing partsList ${partsList}`);

            for (const endpointId of partsList) {

                const endpoint = node.getDeviceById(endpointId);

                if (!endpoint) {
                    continue;
                }

                const descriptorCluster = endpoint.getClusterClient(DescriptorCluster);

                if (!descriptorCluster) {
                    continue;
                }

                const deviceTypeList = await descriptorCluster.getDeviceTypeListAttribute();

                for (const deviceType of deviceTypeList) {
                    deviceTypes.push(deviceType.deviceType)
                }
            }
        }

        return {
            id: nodeId.toString(),
            state: node.state,
            productName,
            vendorName,
            deviceTypes,
        }
    });

    const devices = await Promise.all(mapResult);

    response.send(devices);
});

app.get("/sources", async (_, response) => {

    var sources: any[] = [];

    // Find all endpoints and assign them a source based on their deviceType
    //
    const nodeDetails = commissioningController.getCommissionedNodes();

    await Promise.all(nodeDetails.map(async (nodeId) => {

        const node = await commissioningController.getNode(nodeId);

        const basicInformationCluster = node.getRootClusterClient(BasicInformationCluster);

        var productName = await basicInformationCluster?.getProductNameAttribute();
        var vendorName = await basicInformationCluster?.getVendorNameAttribute();

        const descriptorCluster = node.getRootClusterClient(DescriptorCluster);

        const partsList = await descriptorCluster!.getPartsListAttribute();

        for (const endpointId of partsList!) {

            const endpoint = node.getDeviceById(endpointId);

            if (!endpoint) {
                continue;
            }

            const descriptorCluster = endpoint.getClusterClient(DescriptorCluster);

            if (!descriptorCluster) {
                continue;
            }

            const deviceTypeList = await descriptorCluster.getDeviceTypeListAttribute();

            for (const deviceType of deviceTypeList) {
                if (deviceType.deviceType == 1299) {

                    console.log("Adding Tariff");

                    sources.push({
                        nodeId: nodeId.toString(),
                        endpointId: endpointId,
                        source: "tariff",
                        vendorName,
                        productName
                    });

                    break;
                }
            }
        }
    }));

    response.send(sources);
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

    //console.log(`Commissioning ... ${Diagnostic.json(options)}`);

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

var gTariffSourceNodeId: bigint;
var gTariffSourceEndpointId: number;

app.put("/settings", async (request, response) => {

    // Fetch and populate the tariff information if a tariffSource is set.
    //
    const { tariffSourceNodeId, tariffSourceEndpointId } = request.body;

    console.log(`Setting ${tariffSourceNodeId}|${tariffSourceEndpointId} as Tariff Source`);

    gTariffSourceNodeId = tariffSourceNodeId;
    gTariffSourceEndpointId = tariffSourceEndpointId;

    response.send();
});

app.get("/tariff", async (request, response) => {

    // Use the source node.
    //
    const node = await commissioningController.getNode(NodeId(gTariffSourceNodeId));

    const endpoint = node.getDeviceById(gTariffSourceEndpointId);

    // Process the node details
    //
    const commodityTariffCluster = endpoint!.getClusterClient(CommodityTariffCluster);

    let tariffSlots: any[] = [];

    if (commodityTariffCluster) {

        let info = await commodityTariffCluster.getTariffInfoAttribute();
        console.log(`TariffLabel: ${info.tariffLabel}`);
        console.log(`Provider: ${info.providerName}`);

        let unit = await commodityTariffCluster.getTariffUnitAttribute();
        console.log(`Unit: ${unit}`);

        let dayEntries = await commodityTariffCluster.getDayEntriesAttribute();
        console.log(`There are ${dayEntries.length} dayEntries`);

        let dayPatterns = await commodityTariffCluster.getDayPatternsAttribute();
        console.log(`There are ${dayPatterns.length} dayPatterns`);

        let calendarPeriods = await commodityTariffCluster.getCalendarPeriodsAttribute();
        console.log(`There are ${calendarPeriods.length} calendarPeriods`);

        let tariffComponents = await commodityTariffCluster.getTariffComponentsAttribute(true);
        console.log(`There are ${tariffComponents.length} tariffComponents`);

        let periods = await commodityTariffCluster.getTariffPeriodsAttribute();
        console.log(`There are ${periods.length} periods`);

        // Go through each dayEntry??
        for(let i = 0; i < dayEntries.length; i++) {

            console.log(`DayEntry ${i}: dayEntryId ${dayEntries[i].dayEntryId} startTime ${dayEntries[i].startTime}`);
            console.log(`TariffComponent ${i}: price ${tariffComponents[i].price?.price}`);

            var hour = Math.floor(dayEntries[i].startTime / 60);          
            var minute = dayEntries[i].startTime % 60;
            
            tariffSlots.push({
                hour,
                startMinute: minute,
                endMinute: minute == 30 ? 59 : 29,
                price: tariffComponents[i].price.price
            });
        }
    }

    response.send(tariffSlots);
});


const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
    console.log("Server Listening on PORT:", PORT);
});