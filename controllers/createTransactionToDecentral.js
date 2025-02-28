import { ethers } from "ethers";
import { ABI } from "../contracts/abi.js";
const contractAddress = process.env.CONTRACT_ADDRESS_LOCAL;
const contractAbi = ABI.abi; // Use the abi property from the imported ABI object

const provider = new ethers.JsonRpcProvider("http://localhost:8545");
const signer = provider.getSigner();

const privateKey = process.env.PRIVATE_KEY_LOCAL; // Add your private key to .env file
const wallet = new ethers.Wallet(privateKey, provider);

// Contract
const contract = new ethers.Contract(contractAddress, contractAbi, wallet);

// Function to write transaction to blockchain
async function writeTransactionToBlockchain(userId, receiverId, amount, description) {
    try {
        // Convert amount to BigInt
        const amountBN = ethers.toBigInt(amount);

        // Ensure userId and receiverId are strings
        const userIdStr = userId.toString();
        const receiverIdStr = receiverId.toString();

        // Create transaction
        const transaction = await contract.createTransaction(userIdStr, receiverIdStr, amountBN, description);

        console.log("Transaction created:", transaction);

        // Wait for transaction to be mined
        const receipt = await transaction.wait();

        // Return transaction details
        return {
            success: true,
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            events: receipt.events,
        };
    } catch (error) {
        console.error("Error writing to blockchain:", error);
        return {
            success: false,
            error: error.message,
        };
    }
}

// Function to integrate with incrementUsedWater
export async function createBlockchainTransaction(userId, receiverId, amount, description = "Water Usage Payment") {
    try {
        // Ensure all parameters are present
        if (!userId || !receiverId || !amount) {
            throw new Error("Missing required parameters");
        }

        // console.log("createBlockchainTransaction called with:", userId, receiverId, amount, description);

        // Write to blockchain
        const result = await writeTransactionToBlockchain(userId, receiverId, amount, description);

        if (!result.success) {
            throw new Error(`Blockchain transaction failed: ${result.error}`);
        }

        return result;
    } catch (error) {
        console.error("Error in createBlockchainTransaction:", error);
        throw error;
    }
}

// Function to get transactions by user ID from blockchain
export async function getTransactionById(userId) {
    try {
        const userIdStr = userId.toString();
        const transactions = await contract.getTransactionsByUser(userIdStr);

        if (!transactions || transactions.length === 0) {
            return {
                success: true,
                data: [],
                message: "No transactions found for this user",
            };
        }

        try {
            const formattedTransactions = [];
            for (let i = 0; i < transactions.length; i++) {
                const tx = transactions[i];
                console.log("Raw transaction data:", tx);

                // Get each field from the array indices
                const userId = tx[0].toString();
                const receiverId = tx[1].toString();
                const amount = tx[2].toString();
                const description = tx[3];
                const timestamp = parseInt(tx[4].toString());

                formattedTransactions.push({
                    userId,
                    receiverId,
                    amount,
                    description,
                    timestamp,
                });
            }

            return {
                success: true,
                data: formattedTransactions,
            };
        } catch (mappingError) {
            return {
                success: false,
                error: `Error formatting transaction data: ${mappingError.message}`,
                data: [],
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message,
            data: [],
        };
    }
}
