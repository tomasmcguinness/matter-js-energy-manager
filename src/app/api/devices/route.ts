import { Diagnostic, Environment, StorageService, Time } from "@matter/main";
import { GeneralCommissioning } from "@matter/main/clusters";
import { ManualPairingCodeCodec } from "@matter/main/types";
import { CommissioningController, NodeCommissioningOptions } from "@project-chip/matter.js";
import { Device } from '../../device.js'

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

await commissioningController.start();

console.log(`Commissioning controller started with id ${uniqueId} and label "${adminFabricLabel}"`);

export async function GET(req: Request, res: any) {
    const nodes = commissioningController.getCommissionedNodesDetails();

    let devices : Device[] = nodes.map(n => { return <Device> { id: n.nodeId.toString(), name: n.advertisedName } });

    return new Response(JSON.stringify(devices), { status: 200 })
}

export async function POST(request: Request) {
    let data = await request.json();

    let setupPin, shortDiscriminator;

    const pairingCodeCodec = ManualPairingCodeCodec.decode(data.manualSetupCode);
    shortDiscriminator = pairingCodeCodec.shortDiscriminator;
    setupPin = pairingCodeCodec.passcode;

    console.log(`Data extracted from pairing code: ${Diagnostic.json(pairingCodeCodec)}`);

    const commissioningOptions: NodeCommissioningOptions["commissioning"] = {
        regulatoryLocation: GeneralCommissioning.RegulatoryLocationType.IndoorOutdoor,
        regulatoryCountryCode: "XX",
    };

    const options: NodeCommissioningOptions = {
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
}