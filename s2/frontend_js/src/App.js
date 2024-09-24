import React, { useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl, Connection, PublicKey, Transaction, SystemProgram, Keypair } from '@solana/web3.js';
import {
    getOrCreateAssociatedTokenAccount,
    mintTo,
    transfer,
    burn,
    approve,
    TOKEN_PROGRAM_ID,
    createInitializeMintInstruction,
    getMinimumBalanceForRentExemptMint,
    MINT_SIZE,
} from '@solana/spl-token';
import { useWallet } from '@solana/wallet-adapter-react';
import { createMintToCheckedInstruction } from '@solana/spl-token'; // Import createMintToCheckedInstruction
require('./App.css');

require('@solana/wallet-adapter-react-ui/styles.css');

const network = 'devnet';
const connection = new Connection(clusterApiUrl(network), 'confirmed');

const SolanaTokenUI = () => {
    const { publicKey, sendTransaction } = useWallet();
    const [mintAddress, setMintAddress] = useState('');
    const [amount, setAmount] = useState(0);
    const [recipient, setRecipient] = useState('');
    const [delegateAddress, setDelegateAddress] = useState('');

    const createToken = async () => {
        if (!publicKey) {
            alert('Please connect your wallet.');
            return;
        }
    
        try {
            // Generate a new Keypair for the mint account
            const mintAccount = Keypair.generate(); // Generates both public and private key for the mint
    
            const transaction = new Transaction().add(
                SystemProgram.createAccount({
                    fromPubkey: publicKey,  // Wallet's public key (payer)
                    newAccountPubkey: mintAccount.publicKey, // New mint account public key (generated Keypair)
                    space: MINT_SIZE, // The size of the mint account
                    lamports: await getMinimumBalanceForRentExemptMint(connection), // Rent exemption balance
                    programId: TOKEN_PROGRAM_ID // Token program ID
                }),
                createInitializeMintInstruction(
                    mintAccount.publicKey, // The public key of the new mint account
                    8,          // Decimals
                    publicKey,  // Mint authority (wallet public key)
                    publicKey   // Freeze authority (optional, can be set to null)
                )
            );
    
            // Sign and send the transaction using the wallet's `sendTransaction` function
            const signature = await sendTransaction(transaction, connection, {
                signers: [mintAccount], // Pass the Keypair (mintAccount), not its publicKey
            });
            await connection.confirmTransaction(signature, 'confirmed');
    
            setMintAddress(mintAccount.publicKey.toBase58());
            alert(`Token created with mint address: ${mintAccount.publicKey.toBase58()}`);
        } catch (err) {
            console.error('Failed to create token manually', err);
        }
    };

    // const mintToken = async () => {
    //     if (!publicKey || !amount) {
    //         console.error("Wallet not connected or missing input fields");
    //         return;
    //     }
    
    //     console.log("Minting tokens...");
    
    //     try {
    //         // Replace with the correct mint public key
    //         const mintPublicKey = new PublicKey(mintAddress); // Use mintAddress as the mint public key
    
    //         // Check if the associated token account exists, create if not
    //         const associatedTokenAccount = await getOrCreateAssociatedTokenAccount(
    //             connection, // Solana connection
    //             publicKey,  // Payer (wallet public key)
    //             mintPublicKey, // Mint of the token
    //             publicKey  // Owner of the associated token account
    //         );
    
    //         const tx = new Transaction().add(
    //             createMintToCheckedInstruction(
    //                 mintPublicKey,               // The mint public key
    //                 associatedTokenAccount.address, // The recipient's associated token account
    //                 publicKey,                   // The mint authority (wallet's public key)
    //                 Number(amount),              // The amount of tokens to mint
    //                 8                            // Decimals (e.g., 8 decimals for SPL tokens)
    //             )
    //         );
    
    //         // Send the transaction
    //         const signature = await sendTransaction(tx, connection);
    //         await connection.confirmTransaction(signature, 'processed');
    
    //         console.log("Transaction signature:", signature);
    //         alert(`Minted ${amount} tokens to ${publicKey.toBase58()}`);
    //     } catch (error) {
    //         console.error("Error minting tokens:", error);
    //         alert(`Error minting tokens: ${error.message}`);
    //     }
    
    //     console.log("Minting completed");
    // };
    
    const mintToken = async () => {
        if (!publicKey || !amount) {
            console.error("Wallet not connected or missing input fields");
            return;
        }
    
        console.log("Minting tokens...");
    
        try {
            // Replace with the correct mint public key
            const mintPublicKey = new PublicKey(mintAddress); // Use mintAddress as the mint public key
    
            // Check the wallet balance before attempting
            const balance = await connection.getBalance(publicKey);
            console.log("Wallet balance:", balance);
            if (balance < 1e6) { // Assume 0.001 SOL (1,000,000 lamports) is needed for rent
                alert("Not enough SOL in wallet to create token account.");
                return;
            }
    
            // Create or get the associated token account for the wallet and mint
            const associatedTokenAccount = await getOrCreateAssociatedTokenAccount(
                connection,         // Solana connection
                publicKey,          // Payer (wallet public key)
                mintPublicKey,      // The mint public key
                publicKey           // Owner of the associated token account (wallet public key)
            );
    
            console.log("Associated token account:", associatedTokenAccount.address.toBase58());
    
            const tx = new Transaction().add(
                createMintToCheckedInstruction(
                    mintPublicKey,               // The mint public key
                    associatedTokenAccount.address, // The recipient's associated token account
                    publicKey,                   // The mint authority (wallet's public key)
                    Number(amount),              // The amount of tokens to mint
                    8                            // Decimals (e.g., 8 decimals for SPL tokens)
                )
            );
    
            // Send the transaction
            const signature = await sendTransaction(tx, connection);
            await connection.confirmTransaction(signature, 'processed');
    
            console.log("Transaction signature:", signature);
            alert(`Minted ${amount} tokens to ${associatedTokenAccount.address.toBase58()}`);
        } catch (error) {
            if (error.message.includes("TokenAccountNotFoundError")) {
                console.error("Associated token account not found. Ensure mint exists and wallet has enough SOL.");
            } else {
                console.error("Error minting tokens:", error);
            }
            alert(`Error minting tokens: ${error.message}`);
        }
    
        console.log("Minting completed");
    };
    
    const transferToken = async () => {
        if (!mintAddress || !publicKey || !recipient) {
            alert('Please provide a recipient and connect your wallet.');
            return;
        }
        try {
            const mint = new PublicKey(mintAddress);
            const recipientPublicKey = new PublicKey(recipient);
            const fromAccount = await getOrCreateAssociatedTokenAccount(connection, publicKey, mint, publicKey);
            const toAccount = await getOrCreateAssociatedTokenAccount(connection, publicKey, mint, recipientPublicKey);
            await transfer(connection, publicKey, fromAccount.address, toAccount.address, publicKey, [], amount);
            alert(`Transferred ${amount} tokens to ${recipient}`);
        } catch (err) {
            console.error('Failed to transfer token', err);
        }
    };

    const burnToken = async () => {
        if (!mintAddress || !publicKey) {
            alert('Please connect your wallet.');
            return;
        }
        try {
            const mint = new PublicKey(mintAddress);
            const fromAccount = await getOrCreateAssociatedTokenAccount(connection, publicKey, mint, publicKey);
            await burn(connection, publicKey, fromAccount.address, mint, publicKey, [], amount);
            alert(`Burned ${amount} tokens.`);
        } catch (err) {
            console.error('Failed to burn token', err);
        }
    };

    const delegateToken = async () => {
        if (!mintAddress || !publicKey || !delegateAddress) {
            alert('Please connect your wallet and provide a delegate address.');
            return;
        }
        try {
            const mint = new PublicKey(mintAddress);
            const fromAccount = await getOrCreateAssociatedTokenAccount(connection, publicKey, mint, publicKey);
            const delegatePublicKey = new PublicKey(delegateAddress);
            await approve(connection, publicKey, fromAccount.address, delegatePublicKey, publicKey, [], amount);
            alert(`Delegated ${amount} tokens to ${delegateAddress}`);
        } catch (err) {
            console.error('Failed to delegate token', err);
        }
    };

    return (
        <div className="container">
            <h1>Solana Token Management</h1>
            <WalletMultiButton />

            <div>
                <button onClick={createToken}>Create Token</button>
                <button onClick={mintToken}>Mint Token</button>
                <button onClick={transferToken}>Transfer Token</button>
                <button onClick={burnToken}>Burn Token</button>
                <button onClick={delegateToken}>Delegate Token</button>
            </div>

            <div>
                <input
                    type="text"
                    value={mintAddress}
                    onChange={(e) => setMintAddress(e.target.value)}
                    placeholder="Mint Address"
                />
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    placeholder="Amount"
                />
                <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Recipient Address"
                />
                <input
                    type="text"
                    value={delegateAddress}
                    onChange={(e) => setDelegateAddress(e.target.value)}
                    placeholder="Delegate Address"
                />
            </div>
        </div>
    );
};

// Main App component with wallet connection
const App = () => {
    const wallets = [];

    return (
        <ConnectionProvider endpoint={clusterApiUrl(network)}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <SolanaTokenUI />
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

export default App;
