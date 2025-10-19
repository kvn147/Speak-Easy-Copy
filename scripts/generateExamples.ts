/**
 * Manual Script to Generate Example Conversations
 * 
 * Run this script to generate example conversations for a specific user:
 * 
 * Usage:
 *   ts-node scripts/generateExamples.ts <userId>
 * 
 * Or with Node.js:
 *   node -r ts-node/register scripts/generateExamples.ts <userId>
 */

import { generateExampleConversations } from '../app/lib/generateExamples';

const userId = process.argv[2];

if (!userId) {
  console.error('❌ Error: Please provide a user ID');
  console.log('Usage: ts-node scripts/generateExamples.ts <userId>');
  process.exit(1);
}

try {
  console.log(`🔄 Generating example conversations for user: ${userId}`);
  generateExampleConversations(userId);
  console.log('✅ Success! Example conversations created in:');
  console.log(`   conversations/${userId}/`);
  console.log('\n📝 Generated files:');
  console.log('   - welcome-to-your-viewer.md');
  console.log('   - learning-react-hooks.md');
  console.log('   - project-planning-session.md');
  console.log('   - debugging-firebase-auth.md');
} catch (error) {
  console.error('❌ Error generating conversations:', error);
  process.exit(1);
}
