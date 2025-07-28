import { CommissioningController } from "@project-chip/matter.js";

declare global {
    var matterServer : CommissioningController;
}

export default global;