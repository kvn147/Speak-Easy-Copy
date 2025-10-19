import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Initialize S3 client
// In production (EC2), this will automatically use the IAM role credentials
// In development, it will use the credentials from environment variables
const s3ClientConfig: any = {
  region: process.env.AWS_REGION || 'us-east-1',
};

// Only add explicit credentials if they're provided (for local development)
// On EC2 with IAM role, omit credentials to use the instance role automatically
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3ClientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

const s3Client = new S3Client(s3ClientConfig);

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'speakeasy-conversations';

/**
 * Upload a conversation file to S3
 */
export async function uploadConversationToS3(userId: string, filename: string, content: string): Promise<void> {
  const key = `${userId}/${filename}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: content,
    ContentType: 'text/markdown',
  });

  await s3Client.send(command);
  console.log(`\n💾 Conversation uploaded to S3: ${key}`);
}
