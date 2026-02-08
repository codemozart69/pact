import 'dotenv/config'; // this loads .env automatically
import { privateKeyToAccount } from 'viem/accounts';

const pk = process.env.HEDERA_TESTNET_PRIVATE_KEY as `0x${string}`;
if (!pk) throw new Error("HEDERA_TESTNET_PRIVATE_KEY not set!");

const account = privateKeyToAccount(pk);
console.log("Derived address:", account.address);
