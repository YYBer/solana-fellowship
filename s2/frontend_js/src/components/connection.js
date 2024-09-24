import { Connection, PublicKey } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

export const fetchAccountInfo = async (publicKey) => {
  console.log('publicKey',publicKey)
  try {

    const accountInfo = await connection.getAccountInfo(publicKey);
    console.log("Account Info:", accountInfo);
    return accountInfo;
  } catch (error) {
    console.error("Error fetching account info:", error);
    return null;
  }
};

