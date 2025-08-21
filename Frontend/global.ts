import { CommissioningController } from "@project-chip/matter.js";

declare global {
    var matterServer : CommissioningController;
    var energyManager: any
}

export default global;