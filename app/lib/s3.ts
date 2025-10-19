import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';

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
 * Upload a file to S3
 */
export async function uploadToS3(key: string, content: string, contentType: string = 'text/markdown'): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: content,
    ContentType: contentType,
  });

  await s3Client.send(command);
}

/**
 * Download a file from S3
 */
export async function downloadFromS3(key: string): Promise<string | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      return null;
    }

    // Convert stream to string
    const bodyContents = await streamToString(response.Body as any);
    return bodyContents;
  } catch (error: any) {
    if (error.name === 'NoSuchKey') {
      return null;
    }
    throw error;
  }
}

/**
 * List all files in a user's folder
 */
export async function listUserFiles(userId: string): Promise<string[]> {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: `${userId}/`,
  });

  const response = await s3Client.send(command);

  if (!response.Contents) {
    return [];
  }

  return response.Contents
    .map(item => item.Key)
    .filter((key): key is string => key !== undefined)
    .filter(key => key.endsWith('.md'));
}

/**
 * Delete a file from S3
 */
export async function deleteFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Get the S3 key for a user's conversation file
 */
export function getConversationKey(userId: string, conversationId: string): string {
  return `${userId}/${conversationId}.md`;
}

/**
 * Helper function to convert readable stream to string
 */
async function streamToString(stream: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on('data', (chunk: Uint8Array) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}
