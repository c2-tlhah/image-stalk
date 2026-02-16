
import { resolveProfileImageUrl } from '../app/services/profile-resolver';

async function testResolution() {
  const testUrls = [
    'https://github.com/remix-run',
    'https://www.instagram.com/instagram/', // This might fail due to auth
    'https://twitter.com/elonmusk', // might fail due to X protection
  ];

  for (const url of testUrls) {
    console.log(`Testing: ${url}`);
    try {
      const result = await resolveProfileImageUrl(url);
      console.log(`Result: ${result}`);
    } catch (error) {
      console.error(`Error: ${error}`);
    }
    console.log('---');
  }
}

testResolution();
