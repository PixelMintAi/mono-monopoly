"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameStateSchema = exports.RoomSchema = exports.PlayerSchema = exports.GameSettingsSchema = exports.SpaceSchema = void 0;
const zod_1 = require("zod");
exports.SpaceSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    type: zod_1.z.enum(['city', 'airport', 'utility', 'tax', 'chance', 'community', 'corner']),
    price: zod_1.z.number().optional(),
    rent: zod_1.z.number().optional(),
    ownedBy: zod_1.z.any().nullable(),
    position: zod_1.z.number()
});
exports.GameSettingsSchema = zod_1.z.object({
    map: zod_1.z.enum(['Classic']),
    maxPlayers: zod_1.z.number().min(2).max(8),
    startingAmount: zod_1.z.number().min(1000).max(10000)
});
exports.PlayerSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    color: zod_1.z.string(),
    position: zod_1.z.number(),
    money: zod_1.z.number(),
    properties: zod_1.z.array(exports.SpaceSchema),
    inJail: zod_1.z.boolean(),
    jailTurns: zod_1.z.number(),
    cards: zod_1.z.array(zod_1.z.string()),
    hasRolled: zod_1.z.boolean()
});
exports.RoomSchema = zod_1.z.object({
    id: zod_1.z.string(),
    settings: zod_1.z.object({
        maxPlayers: zod_1.z.number(),
        startingAmount: zod_1.z.number()
    }),
    players: zod_1.z.array(exports.PlayerSchema),
    gameStarted: zod_1.z.boolean(),
    currentPlayerIndex: zod_1.z.number(),
    boardSpaces: zod_1.z.array(exports.SpaceSchema),
    lastDiceRoll: zod_1.z.object({
        dice1: zod_1.z.number(),
        dice2: zod_1.z.number(),
        playerId: zod_1.z.string()
    }).nullable()
});
exports.GameStateSchema = zod_1.z.object({
    players: zod_1.z.array(exports.PlayerSchema),
    currentPlayerIndex: zod_1.z.number(),
    gameStarted: zod_1.z.boolean(),
    roomId: zod_1.z.string()
});
