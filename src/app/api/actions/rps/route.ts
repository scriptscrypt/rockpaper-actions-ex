import { envEnviroment } from "@/lib/envConfig/envConfig";
import { utilDetermineWinner } from "@/utils/utilDetermineWinner";
import {
  ActionPostResponse,
  ACTIONS_CORS_HEADERS,
  createPostResponse,
  ActionGetResponse,
  ActionPostRequest,
  ActionIdentifierError,
} from "@solana/actions";
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { NextResponse } from "next/server";

export const GET = async (req: Request) => {
  const requestUrl = new URL(req.url);
  const baseHref = new URL(`/api/actions`, requestUrl.origin).toString();

  const payload: ActionGetResponse = {
    type: "action",
    title: `Rock paper scissors`,
    icon: new URL("/initial.png", new URL(req.url).origin).toString(),
    description: `\nPlay Rock Paper Scissors with your friends, Enter your Telegram username and select your action.`,
    label: "Enter your Telegram userId",
    links: {
      actions: [
        {
          label: "Rock paper scissors",
          href: `${baseHref}/rps?paramRPS={paramRPS}&paramTgUserId={paramTgUserId}`,
          parameters: [
            {
              type: "text",
              name: "paramTgUserId",
              label: "Enter your Telegram username",
              required: true,
            },
            {
              type: "select",
              name: "paramRPS",
              label: "Pick - Rock / paper / scissor",
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
  };

  return Response.json(payload, {
    headers: ACTIONS_CORS_HEADERS,
  });
};

// DO NOT FORGET TO INCLUDE THE `OPTIONS` HTTP METHOD
// THIS WILL ENSURE CORS WORKS FOR BLINKS
export const OPTIONS = GET;

export const POST = async (req: Request) => {
  const requestUrl = new URL(req.url);
  const baseHref = new URL(`/api/actions`, requestUrl.origin).toString();

  // Get the 'paramRPS' parameter from the URL
  const userChoice = requestUrl.searchParams.get("paramRPS");
  console.log(`User's choice: ${userChoice}`);

  // Ensure userChoice is valid
  const validChoices = ["rock", "paper", "scissors"];
  if (!userChoice || !validChoices.includes(userChoice)) {
    return NextResponse?.json(
      {
        message: "Invalid choice. Please select rock, paper, or scissors.",
      },
      {
        headers: ACTIONS_CORS_HEADERS,
        status: 400,
      }
    );
  }

  // Randomly select a choice for the server
  const serverChoice =
    validChoices[Math.floor(Math.random() * validChoices.length)];
  console.log(`Server's choice: ${serverChoice}`);

  // Determine the result
  const result = utilDetermineWinner(userChoice, serverChoice);
  console.log(`Game result: ${result}`);

  // Transaction part for SOL tx:
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

  transaction.add(
    SystemProgram.transfer({
      fromPubkey: account,
      toPubkey: new PublicKey("39G4S57hEMsbD1npzi22heiEvjAHnnTG3ixciDHozcNj"),
      lamports: 0.0001 * LAMPORTS_PER_SOL,
    })
  );

  transaction.feePayer = account;
  transaction.recentBlockhash = (
    await connection.getLatestBlockhash()
  ).blockhash;
  console.log("Set fee payer and recent blockhash");

  // Conditional payload based on the game result
  let payload: ActionPostResponse;

  if (result === "won") {
    payload = await createPostResponse({
      fields: {
        transaction,
        message: `You chose ${userChoice?.toUpperCase()}, the Server Blinked ${serverChoice?.toUpperCase()}. Result: ${result}`,
        links: {
          next: {
            action: {
              type: "completed",
              title: `Rock paper scissors #2`,
              icon: new URL("/win.png", new URL(req.url).origin).toString(),
              description: `You chose ${userChoice?.toUpperCase()}, the Server Blinked ${serverChoice?.toUpperCase()}. Result: ${result}`,
              label: "Yayy",
            },
            type: "inline",
          },
        },
      },
    });
  } else {
    payload = await createPostResponse({
      fields: {
        transaction,
        message: "Rock paper scissors",
        links: {
          next: {
            action: {
              type: "action",
              title: `Rock paper scissors`,
              icon: new URL("/rps.png", new URL(req.url).origin).toString(),
              description: `\nPlay Rock Paper Scissors, You've got another chance! to Win Big!`,
              label: "Select Action",
              links: {
                actions: [
                  {
                    label: "Rock paper scissors",
                    href: `${baseHref}/rps?paramRPS={paramRPS}`,
                    parameters: [
                      {
                        type: "radio",
                        name: "paramRPS",
                        label: "Rock? paper? scissors?",
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
            },

            type: "inline",
          },
        },
      },
    });
  }
  console.log("Post response payload:", payload);

  return Response.json(payload, {
    headers: ACTIONS_CORS_HEADERS,
  });
};
