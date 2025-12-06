"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ticketController = exports.kitchenController = exports.ticketRoutes = exports.kitchenRoutes = void 0;
var kitchen_routes_1 = require("./routes/kitchen.routes");
Object.defineProperty(exports, "kitchenRoutes", { enumerable: true, get: function () { return __importDefault(kitchen_routes_1).default; } });
var ticket_routes_1 = require("./routes/ticket.routes");
Object.defineProperty(exports, "ticketRoutes", { enumerable: true, get: function () { return __importDefault(ticket_routes_1).default; } });
var kitchen_controller_1 = require("./controllers/kitchen.controller");
Object.defineProperty(exports, "kitchenController", { enumerable: true, get: function () { return kitchen_controller_1.kitchenController; } });
var ticket_controller_1 = require("./controllers/ticket.controller");
Object.defineProperty(exports, "ticketController", { enumerable: true, get: function () { return ticket_controller_1.ticketController; } });
