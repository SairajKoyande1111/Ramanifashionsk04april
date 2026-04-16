module.exports = {
  apps: [{
    name: 'ramaniV2',
    script: './dist/index.js',
    env: {
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb+srv://ramanifashion2026_db_user:Fvgh6aJF8YK6R9rQ@ramanifashion.tknlkyl.mongodb.net/?appName=ramanifashion',
      PORT: '5000',
      SMS_API_KEY: 'EmjkjMNYrouCuA1i',
      SMS_SENDER_ID: 'RAMFA',
      SMS_TEMPLATE_ID: '1707177503961928847',
      PHONEPE_CLIENT_ID: 'M22QN7SRPWWQ4_2511161203',
      PHONEPE_CLIENT_SECRET: 'NGFiNzVkZGYtNjhjYi00OTFjLWI1MWMtMGNkM2U5ZGI4NWJj',
      PHONEPE_MERCHANT_ID: 'M22QN7SRPWWQ4',
      PHONEPE_SALT_INDEX: '5b5b1002-099f-4ae7-abda-a2507503a219',
      PHONEPE_SALT_KEY: '1',
      SHIPROCKET_API_EMAIL: 'raneaniket23@gmail.com',
      SHIPROCKET_API_PASSWORD: '!ExeJ2E&MyR4sUbK',
      CLOUDINARY_CLOUD_NAME: 'dttagqkxr',
      CLOUDINARY_API_KEY: '999667918396535',
      CLOUDINARY_API_SECRET: 'nYRix_SAntFAS_LImwSxdc-O7Lk'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};