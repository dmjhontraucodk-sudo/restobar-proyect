"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewsService = exports.reviewsController = exports.reviewsRoutes = void 0;
// backend_core/src/modules/reviews/index.ts
var reviews_routes_1 = require("./routes/reviews.routes");
Object.defineProperty(exports, "reviewsRoutes", { enumerable: true, get: function () { return __importDefault(reviews_routes_1).default; } });
var reviews_controller_1 = require("./controllers/reviews.controller");
Object.defineProperty(exports, "reviewsController", { enumerable: true, get: function () { return reviews_controller_1.reviewsController; } });
var reviews_service_1 = require("./services/reviews.service");
Object.defineProperty(exports, "reviewsService", { enumerable: true, get: function () { return reviews_service_1.reviewsService; } });
