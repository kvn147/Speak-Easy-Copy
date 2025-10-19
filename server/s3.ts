import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

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
