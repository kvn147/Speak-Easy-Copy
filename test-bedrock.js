import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import dotenv from 'dotenv'

dotenv.config()

console.log('🔍 Testing AWS Bedrock Access...\n')

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
})

async function testBedrockAccess() {
  try {
    console.log('📍 Region:', process.env.AWS_REGION || 'us-east-1')
    console.log('🔑 Access Key ID:', process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID.substring(0, 10) + '...' : 'NOT SET')
    console.log('\n⏳ Testing model access...\n')

    const payload = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 50,
      messages: [
        {
          role: "user",
          content: "Say 'Bedrock is working!' if you can read this."
        }
      ]
    }

    const command = new InvokeModelCommand({
      modelId: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(payload)
    })

    console.log('🚀 Invoking Claude 3.5 Sonnet v2...')
    const response = await bedrockClient.send(command)
    const responseBody = JSON.parse(new TextDecoder().decode(response.body))

    console.log('\n✅ SUCCESS! Bedrock is working!\n')
    console.log('Response from Claude:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(responseBody.content[0].text)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('🎉 Your Bedrock access is fully configured!')
    console.log('✨ The conversation coach should work now.')

  } catch (error) {
    console.error('\n❌ BEDROCK ACCESS ERROR:\n')

    if (error.name === 'ResourceNotFoundException') {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('❌ Model Access Not Approved')
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('\nYou need to request access to Claude models:\n')
      console.error('1. Go to: https://console.aws.amazon.com/bedrock/')
      console.error('2. Click "Model access" in the left sidebar')
      console.error('3. Click "Manage model access"')
      console.error('4. Enable "Anthropic - Claude 3.5 Sonnet v2"')
      console.error('5. Fill out the use case form')
      console.error('6. Wait for approval (usually instant)\n')
      console.error('Error details:', error.message)

    } else if (error.name === 'ValidationException') {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('❌ Model ID or Configuration Error')
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('\nError:', error.message)
      console.error('\nTrying alternative model ID...\n')

      // Try without cross-region profile
      await testAlternativeModel()

    } else if (error.name === 'UnrecognizedClientException') {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('❌ AWS Credentials Invalid')
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('\nYour AWS credentials are incorrect.')
      console.error('Check your .env file:\n')
      console.error('AWS_ACCESS_KEY_ID=your_key_here')
      console.error('AWS_SECRET_ACCESS_KEY=your_secret_here')
      console.error('AWS_REGION=us-east-1\n')

    } else {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('❌ Unknown Error')
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('\nError type:', error.name)
      console.error('Message:', error.message)
      console.error('\nFull error:', error)
    }
  }
}

async function testAlternativeModel() {
  try {
    console.log('⏳ Testing with base model ID (without cross-region profile)...\n')

    const payload = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 50,
      messages: [
        {
          role: "user",
          content: "Say 'Alternative model working!' if you can read this."
        }
      ]
    }

    const command = new InvokeModelCommand({
      modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0", // Base model ID
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(payload)
    })

    const response = await bedrockClient.send(command)
    const responseBody = JSON.parse(new TextDecoder().decode(response.body))

    console.log('✅ SUCCESS with base model ID!\n')
    console.log('Response:', responseBody.content[0].text)
    console.log('\n💡 Update your code to use: anthropic.claude-3-5-sonnet-20241022-v2:0')

  } catch (altError) {
    console.error('❌ Alternative model also failed:', altError.message)
  }
}

testBedrockAccess()
