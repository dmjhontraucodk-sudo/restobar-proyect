import { cloudinary } from '@shared/config/cloudinary.config';
import streamifier from 'streamifier';
import { UploadApiResponse } from 'cloudinary'; // Import UploadApiResponse

export const uploadService = {
  async uploadImage(fileBuffer: Buffer, fileName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          public_id: `restobar_uploads/${fileName.split('.')[0]}_${Date.now()}`,
          overwrite: true,
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
};
