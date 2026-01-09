/**
 * @license
 * Copyright 2022-2026 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ClusterBehavior, ClusterId, Identity, MaybePromise, VendorId } from "@matter/main";
import {
    AttributeElement,
    ClusterElement,
    ClusterModel,
    CommandElement,
    DatatypeElement,
    EventElement,
    FieldElement,
} from "@matter/main/model";
import {
    Attribute,
    ClusterRegistry,
    Command,
    Event,
    MutableCluster,
    Priority,
    TlvField,
    TlvInt16,
    TlvInt8,
    TlvEnum,
    TlvNullable,
    TlvObject,
    TlvString,
    TlvArray,
    TlvUInt32,
    TlvUInt16,
    TypeFromSchema,
    TlvInt32,
} from "@matter/main/types";

// export enum TariffUnit {
//         /**
//          * Entry would cause a duplicate credential/ID.
//          */
//         kWh = 0,

//         /**
//          * Entry would replace an occupied slot.
//          */
//         kVAh = 1
//     };

//     export type { TariffUnit };


/** Define the Cluster ID, custom clusters use a special extended formt that also contains the Vendor Id */
const commodityTariffClusterId = ClusterId(0x0700);

/**
 * Defines the Cluster on Tlv Schema level in a special namespace structure to match the official cluster
 * structures of matter.js.
 * All places that contains "MyFancy..." belong to the custom cluster details, all rest can be left statically like the
 * given names.
 * For more examples and usages of features in such clusters and how the code should look then check the standard
 * cluster Tlv definitions in packages/matter.js/cluster/definitions/*
 */
export namespace CommodityTariffFunctionality {

    export const TlvTariffPeriod = TlvObject({
        label: TlvField(0, TlvString.bound({ maxLength: 128 }))
    });

    export const TlvCurrency = TlvObject({
        tariffLabel: TlvField(0, TlvString.bound({ maxLength: 128 })),
        providerName: TlvField(0, TlvString.bound({ maxLength: 128 }))
    });

    export const TlvTariffInformation = TlvObject({
        tariffLabel: TlvField(0, TlvString.bound({ maxLength: 128 })),
        providerName: TlvField(1, TlvString.bound({ maxLength: 128 })),
        currency: TlvField(2, TlvCurrency)
    });

    export const TlvDayEntry = TlvObject({
        dayEntryId: TlvField(0, TlvUInt32),
        startTime: TlvField(1, TlvUInt16)
    });

    export const TlvDayPattern = TlvObject({
        dayPatternId: TlvField(0, TlvUInt32),
        // daysOfWeek 
        dayEntryIds: TlvField(2, TlvArray(TlvUInt32, { maxLength: 96 }))
    });

    export const TlvCalendarPeriod = TlvObject({
        dayPatternId: TlvField(0, TlvUInt32),
        dayEntryIds: TlvField(2, TlvArray(TlvUInt32, { maxLength: 96 }))
    });

    export const TlvTariffPrice = TlvObject({
        price: TlvField(1, TlvUInt32),
    });

    export const TlvTariffComponent = TlvObject({
        tariffComponentID: TlvField(0, TlvUInt32),
        Price: TlvField(2, TlvTariffPrice)
    });

    /**
     * @see {@link Cluster}
     */
    export const ClusterInstance = MutableCluster({
        id: commodityTariffClusterId,
        name: "CommodityTariffFunctionality",
        revision: 1,

        attributes: {
            tariffInfo: Attribute(0x0, TlvTariffInformation),
            tariffUnit: Attribute(0x1, TlvNullable(TlvInt8)),
            DayEntries: Attribute(0x0E, TlvArray(TlvDayEntry, { maxLength: 672 })),
            DayPatterns: Attribute(0x0E, TlvArray(TlvDayPattern, { maxLength: 28 })),
            CalendarPeriods: Attribute(0x0E, TlvArray(TlvCalendarPeriod, { maxLength: 4 })),
            tariffComponents: Attribute(0x0E, TlvArray(TlvTariffComponent, { maxLength: 672 })),
            tariffPeriods: Attribute(0x0E, TlvArray(TlvTariffPeriod, { maxLength: 672 })),
        },

        commands: {},

        events: {},
    });

    export interface Cluster extends Identity<typeof ClusterInstance> { }

    export const Cluster: Cluster = ClusterInstance;

    export const Complete = Cluster;
}

export type CommodityTariffCluster = CommodityTariffFunctionality.Cluster;
export const CommodityTariffCluster = CommodityTariffFunctionality.Cluster;
ClusterRegistry.register(CommodityTariffFunctionality.Complete);

/**
 * matter.js Model Schema for the cluster, need to match with the Tlv Schema above.
 * See more details in packages/matter.js/behavior/definitions/*
 */
const MyFancySchema = ClusterElement({
    name: "CommodityTariff",
    id: commodityTariffClusterId,
    classification: "application",
    description: "CommodityTariff",

    children: [
        AttributeElement({ name: "ClusterRevision", id: 0xfffd, type: "ClusterRevision", default: 1 }),

        AttributeElement({
            name: "TariffUnit",
            id: 0x0001,
            type: "enum8",
            access: "R V",
            conformance: "M",
            quality: "X",
        },),

        AttributeElement({
            name: "TariffPeriods",
            id: 0x000E,
            type: "list",
            access: "R V",
            conformance: "M",
            quality: "X",
        }),

        DatatypeElement({
            name: "TariffPeriodStruct",
        })
    ],
});

/**
 * Interface definitions - exposes the Implementation interface for the cluster and some types to be used in the
 * cluster implementations.
 */
export namespace CommodityTariffFunctionalityInterface {
    export interface Base { }
}

export type CommodityTariffFunctionalityInterface = {
    components: [{ flags: {}; methods: CommodityTariffFunctionalityInterface.Base }];
};

/**
 * Behavior definition for the cluster command handler implementation
 */
export const CommodityTariffFunctionalityBehavior = ClusterBehavior.withInterface<CommodityTariffFunctionalityInterface>().for(
    CommodityTariffFunctionality.Cluster,
    new ClusterModel(MyFancySchema),
);

type CommodityTariffFunctionalityBehaviorType = InstanceType<typeof CommodityTariffFunctionalityBehavior>;
export interface CommodityTariffFunctionalityBehavior extends CommodityTariffFunctionalityBehaviorType { }
type StateType = InstanceType<typeof CommodityTariffFunctionalityBehavior.State>;
export namespace CommodityTariffFunctionalityBehavior {
    export interface State extends StateType { }
}