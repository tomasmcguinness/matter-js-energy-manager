import { Environment, NodeId, StorageService } from "@matter/main";
import { CommissioningController } from "@project-chip/matter.js";
import { DeviceEnergyManagement } from "@matter/main/clusters";
import { ClusterClientObj } from "@matter/main/protocol";
import { NodeStates } from "@project-chip/matter.js/device";

const globalTemporal = global as unknown as { controller: CommissioningController }

export const getController = async () => {

    if (globalTemporal.controller) {
        return globalTemporal.controller;
    }

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

    nodes.forEach(async (nodeId: NodeId) => {
        const node = await commissioningController.getNode(nodeId);

        // node.events.attributeChanged.on(({ path: { nodeId, clusterId, endpointId, attributeName }, value }) =>
        //     console.log(
        //         `attributeChangedCallback ${nodeId}: Attribute ${endpointId}/${clusterId}/${attributeName} changed to ${Diagnostic.json(
        //             value,
        //         )}`,
        //     ),
        // );

        if (!node.isConnected) {
            node.connect();
        }

        node.events.stateChanged.on(async (info) => {
            switch (info) {
                case NodeStates.Connected:
                    console.log(`state changed: Node ${nodeId} connected`);

                    const devices = node.getDevices();

                    //console.log({ devices });

                    if (devices[1] && devices[1].number === 2) {

                        console.log('Attempting to subscribe to the forecast');

                        const deviceEnergyManagement: ClusterClientObj<DeviceEnergyManagement.Complete> | undefined = devices[1].getClusterClient(DeviceEnergyManagement.Complete);

                        if (deviceEnergyManagement !== undefined) {

                            let forecast = await deviceEnergyManagement.getForecastAttribute();

                            console.log({forecast});

                            console.log('Subscribing to the forecast...');

                            deviceEnergyManagement.addForecastAttributeListener(value => {
                                console.log("Forecast Updated", value);
                            });
                        } else {
                            console.error('No cluster client...');
                        }
                    }

                    break;
                // case NodeStates.Disconnected:
                //     console.log(`state changed: Node ${nodeId} disconnected`);
                //     break;
                // case NodeStates.Reconnecting:
                //     console.log(`state changed: Node ${nodeId} reconnecting`);
                //     break;
                // case NodeStates.WaitingForDeviceDiscovery:
                //     console.log(`state changed: Node ${nodeId} waiting for device discovery`);
                //     break;
            }
        });
    });

    console.log(`Commissioning controller started with id ${uniqueId} and label "${adminFabricLabel}"`);

    globalTemporal.controller = commissioningController;

    return globalTemporal.controller;
}
