import express from "express";
import http from "http"
import cors from "cors";
import { Server } from "socket.io";
import { Environment, StorageService } from "@matter/main";
import { CommissioningController } from "@project-chip/matter.js";
import { NodeStates } from "@project-chip/matter.js/device";
import { DeviceEnergyManagement, DescriptorCluster } from "@matter/main/clusters";
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

                    console.log('Attempting to subscribe to the forecast');

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

        var endpoint = node.getRootEndpoint();

        if (!endpoint) {
            return {};
        }

        const fancyCluster = endpoint.getClusterClient(CommodityTariffCluster);

        if (fancyCluster) {
            console.log("CommodityTariffCluster found!");
        }

        var deviceTypes = [];

        const descriptorCluster = endpoint.getClusterClient(DescriptorCluster);

        if (descriptorCluster) {

            const partsList = await descriptorCluster.getPartsListAttribute();

            console.log(`Processing partsList ${partsList}`);

            for (const endpointId of partsList) {

                const endpoint = node.getDeviceById(endpointId);

                if (!endpoint) {
                    continue;
                }

                const fancyCluster = endpoint.getClusterClient(CommodityTariffCluster);

                if (fancyCluster) {
                    console.log("CommodityTariffCluster found!");

                    let unit = await fancyCluster.getTariffUnitAttribute();
                    console.log(`Unit: ${unit}`);

                    let periods = await fancyCluster.getTariffPeriodsAttribute();
                    console.log(`There are ${periods.length} periods`);
                }

                // Get the Descriptor cluster client
                const descriptorCluster = endpoint.getClusterClient(DescriptorCluster);

                if (!descriptorCluster) {
                    continue;
                }

                // Retrieve the device type list
                const deviceTypeList = await descriptorCluster.getDeviceTypeListAttribute();

                for (const deviceType of deviceTypeList) {
                    deviceTypes.push(deviceType.deviceType)
                }
            }
        }

        return {
            id: nodeId.toString(), state: node.state,
            manufacturer: node?.basicInformation?.manufacturerName?.toString(),
            deviceTypes,
        }
    });

    const devices = await Promise.all(mapResult);

    response.send(devices);
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
    console.log("Server Listening on PORT:", PORT);
});