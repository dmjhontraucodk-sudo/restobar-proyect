import dotenv from 'dotenv';

dotenv.config();

const factilizaApiToken = process.env.FACTILIZA_API_TOKEN;

if (!factilizaApiToken) {
  console.warn('FACTILIZA_API_TOKEN is not defined in the environment variables.');
}

export const factilizaConfig = {
  apiToken: factilizaApiToken,
};
