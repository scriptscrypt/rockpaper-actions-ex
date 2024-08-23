import { envEnviroment } from "@/lib/envConfig/envConfig";
import {
  ActionPostResponse,
  ACTIONS_CORS_HEADERS,
  createPostResponse,
  ActionGetResponse,
  ActionPostRequest,
} from "@solana/actions";
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

export const GET = async (req: Request) => {
  const requestUrl = new URL(req.url);

  const baseHref = new URL(`/api/actions`, requestUrl.origin).toString();

  const payload: ActionGetResponse = {
    type: "action",
    title: `Rock paper scissors #2`,
    icon: new URL("/rps.png", new URL(req.url).origin).toString(),
    description: `\nPlay Rock Paper Scissors, You've got this!`,
    label: "Select Action",
    links: {
      actions: [
        {
          label: "Rock paper scissors",
          href: `${baseHref}/test?paramAction={paramAction}`,
          parameters: [
            {
              type: "checkbox",
              name: "paramAction",
              label: "Select R/P/S",
              required: true,
              options: [
                {
                  label: "Rock",
                  value: "rock",
                },
                {
                  label: "Paper",
                  value: "paper",
                },
                {
                  label: "Scissors",
                  value: "scissors",
                },
              ],
            },
          ],
        },
      ],
    },
    // error: {
    //   message: "Please check Group Id and Amount",
    // }
  };

  return Response.json(payload, {
    headers: ACTIONS_CORS_HEADERS,
  });
};

// DO NOT FORGET TO INCLUDE THE `OPTIONS` HTTP METHOD
// THIS WILL ENSURE CORS WORKS FOR BLINKS
export const OPTIONS = GET;

// Testing in the Same File - Working :
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
          href: `${baseHref}/rps`,
          type: "post",
        },
      },
    },
  });
  console.log("Post response payload:", postResPayload);

  return Response.json(postResPayload, {
    headers: ACTIONS_CORS_HEADERS,
  });
};
