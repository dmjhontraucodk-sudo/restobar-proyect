"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadService = void 0;
const cloudinary_config_1 = require("@shared/config/cloudinary.config");
const streamifier_1 = __importDefault(require("streamifier"));
exports.uploadService = {
    async uploadImage(fileBuffer, fileName) {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_config_1.cloudinary.uploader.upload_stream({
                resource_type: 'image',
                public_id: `restobar_uploads/${fileName.split('.')[0]}_${Date.now()}`,
                overwrite: true,
            }, (error, result) => {
                if (result && result.secure_url) {
                    return resolve(result.secure_url);
                }
                return reject(error);
            });
            streamifier_1.default.createReadStream(fileBuffer).pipe(uploadStream);
        });
    },
};
