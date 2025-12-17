// setup_storacha.js
import { create } from '@storacha/client';
import { StoreMemory } from '@storacha/client/stores/memory';
import { Signer } from '@storacha/client/principal/ed25519';

async function setupStoracha() {
  const email = 'priyanshukumar01658@gmail.com'; // <-- IMPORTANT: Replace with YOUR actual email
  if (email === 'YOUR_EMAIL_ADDRESS') {
      console.error("Please replace 'YOUR_EMAIL_ADDRESS' in setup_storacha.js with your actual email.");
      process.exit(1);
  }

  console.log("Creating Storacha client...");
  const client = await create({ store: new StoreMemory() });

  console.log(`Logging in with ${email}. Check your email for a verification link.`);
  const account = await client.login(email);
  console.log("Logged in to account:", account.did());

  console.log("Waiting for payment plan confirmation (should be free tier)...");
  await account.plan.wait();
  console.log("Payment plan confirmed!");

  console.log("Creating a new Storacha space...");
  const space = await client.createSpace('medverify-uploads');
  console.log("Space created:", space.did());

  await client.setCurrentSpace(space.did());
  console.log("Space set as current.");

  console.log("\n--- COPY THIS SPACE DID FOR YOUR REACT APP ---");
  console.log(`const STORACHA_SPACE_DID = "${space.did()}";`);
  console.log("-------------------------------------------\n");

  console.log("\nYour account DID:", account.did());
  console.log("Your agent DID (used by client):", client.agent().did());
}

setupStoracha();