import { cloudinary } from '@shared/config/cloudinary.config';
import streamifier from 'streamifier';
import { UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

export const uploadService = {
  async uploadImage(fileBuffer: Buffer, fileName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          public_id: `restobar_uploads/${fileName.split('.')[0]}_${Date.now()}`,
          overwrite: true,
          timeout: 20000, // 20 segundos de timeout
        },
        (error: Error | undefined, result: UploadApiResponse | undefined) => {
          if (result && result.secure_url) {
            return resolve(result.secure_url);
          }
          return reject(error);
        }
      );

      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
  },

  async uploadStream(stream: Readable, fileName: string): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          public_id: `restobar_uploads/${fileName}`,
          overwrite: true,
          timeout: 20000,
        },
        (error: Error | undefined, result: UploadApiResponse | undefined) => {
          if (result) {
            resolve(result);
          } else {
            reject(error || new Error('Upload failed without a specific error.'));
          }
        }
      );
      stream.pipe(uploadStream);
    });
  },
};
