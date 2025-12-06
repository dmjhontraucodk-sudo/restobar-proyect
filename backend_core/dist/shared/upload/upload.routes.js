"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_middleware_1 = __importDefault(require("@shared/middleware/upload.middleware"));
const upload_controller_1 = require("./upload.controller");
const router = (0, express_1.Router)();
router.post('/upload-image', upload_middleware_1.default.single('image'), upload_controller_1.uploadController.uploadSingleImage);
exports.default = router;
