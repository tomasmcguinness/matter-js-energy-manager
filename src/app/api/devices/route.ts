import { getController } from "../../../../matterServer.js";
import Device from '../../../device.js'
import { GeneralCommissioning } from "@matter/main/clusters";
import { ManualPairingCodeCodec } from "@matter/main/types";
import { Diagnostic, NodeId } from "@matter/main";
import { NodeCommissioningOptions } from "@project-chip/matter.js";

export async function GET(req: Request, res: any) {
    let commissioningController = await getController();
    const nodeDetails = commissioningController.getCommissionedNodes();

    let mapResult : Promise<Device>[] = nodeDetails.map(async (nodeId) => { 
        const node = await commissioningController.getNode(nodeId);
        return <Device> { id: nodeId.toString(), state: node.state, manufacturer: node?.basicInformation?.manufacturerName?.toString() } 
    });

    const devices = await Promise.all(mapResult);

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

    const nodeId = await (await getController()).commissionNode(options);

    console.log(`Commissioning successfully done with nodeId ${nodeId}`);

    return new Response("data", { status: 200 })
}