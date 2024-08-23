import { envEnviroment } from "@/lib/envConfig/envConfig";
import {
  ActionPostRequest,
  ActionPostResponse,
  ACTIONS_CORS_HEADERS,
  createPostResponse,
} from "@solana/actions";
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

export const POST = async (req: Request) => {
  const requestUrl = new URL(req.url);

  const baseHref = new URL(`/api/actions/`, requestUrl.origin).toString();
  console.log(`baseHref is`, baseHref);

  // Transaction part for SOL tx :
  const connection = new Connection(
    process.env.SOLANA_RPC! ||
      clusterApiUrl(envEnviroment === "production" ? "mainnet-beta" : "devnet")
  );
  console.log("Connection established with Solana network");

  // Get recent blockhash
  const transaction = new Transaction();
  console.log("Transaction object created");

  // Set the end user as the fee payer
  const body: ActionPostRequest = await req.json();
  console.log("Request body:", body);

  const account = new PublicKey(body.account);
  console.log(`Account public key:`, account.toBase58());

  // Create transaction
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: account,
      toPubkey: account,
      lamports: 0.0001 * LAMPORTS_PER_SOL,
    })
  );
  console.log("Added transfer instruction for user: ");

  transaction.add(
    SystemProgram.transfer({
      fromPubkey: account,
      toPubkey: new PublicKey("39G4S57hEMsbD1npzi22heiEvjAHnnTG3ixciDHozcNj"),
      lamports: 0.0001 * LAMPORTS_PER_SOL,
    })
  );
  console.log("Added transfer instruction for envSPLAddress");

  transaction.feePayer = account;
  transaction.recentBlockhash = (
    await connection.getLatestBlockhash()
  ).blockhash;
  console.log("Set fee payer and recent blockhash");

  // Before creating the post response, save the data to the DB
  const postResPayload: ActionPostResponse = await createPostResponse({
    fields: {
      transaction,
      message: "Rock paper scissors",
      links: {
        next: {
          href: `${baseHref}/completed`,
          type: "post",
        },
      },
    },
  });
  return Response.json(postResPayload, {
    headers: ACTIONS_CORS_HEADERS,
  });
};
