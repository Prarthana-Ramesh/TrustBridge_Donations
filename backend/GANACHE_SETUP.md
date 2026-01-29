# TrustBridge Blockchain - Ganache Integration Guide

## Prerequisites

1. **Install Ganache**
   - Download from: https://trufflesuite.com/ganache/
   - Or install via npm: `npm install -g ganache-cli`

2. **Install Python Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

## Setup Instructions

### Step 1: Start Ganache

**Option A: Ganache GUI**
- Open Ganache application
- Click "Quickstart" or create a new workspace
- Ensure it's running on port 7545 (default)

**Option B: Ganache CLI**
```bash
ganache-cli -p 7545
```

You should see output like:
```
Ganache CLI v6.x.x (ganache-core: 2.x.x)

Available Accounts
==================
(0) 0x1234... (100 ETH)
(1) 0x5678... (100 ETH)
...

Listening on 127.0.0.1:7545
```

### Step 2: Configure Environment

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and verify the Ganache URL:
   ```
   GANACHE_URL=http://127.0.0.1:7545
   ```

### Step 3: Deploy Smart Contract

Run the deployment script:
```bash
python deploy_contract.py
```

Expected output:
```
======================================================================
 TrustBridge Blockchain - Smart Contract Deployment 
======================================================================

✓ Connected to Ganache at http://127.0.0.1:7545
✓ Using account: 0x...
  Balance: 100.0 ETH

📝 Deploying contract...
  Estimated gas: 123456
  Transaction hash: 0xabcd...
  Waiting for transaction to be mined...

✅ Contract deployed successfully!
  Contract address: 0x1234567890abcdef...
  Block number: 1
  Gas used: 123456

💾 Contract address saved to .env file

🔍 Verification: Block count = 1 (should be 1 with genesis block)

======================================================================
IMPORTANT: Add this to your .env file or environment variables:
======================================================================
CONTRACT_ADDRESS=0x1234567890abcdef...
======================================================================
```

4. **IMPORTANT**: Copy the `CONTRACT_ADDRESS` value and add it to your `.env` file:
   ```
   CONTRACT_ADDRESS=0x1234567890abcdef...
   ```

### Step 4: Start the Backend

```bash
python app.py
```

The blockchain will now:
- ✅ Connect to Ganache
- ✅ Load existing blocks from the smart contract
- ✅ Save new blocks (donations/utilizations) to Ganache
- ✅ Display blockchain data on the frontend

## Viewing Blocks in Ganache

### Ganache GUI
1. Open Ganache application
2. Click on "BLOCKS" tab to see all mined blocks
3. Click on "TRANSACTIONS" tab to see all transactions (block additions)
4. Click on "CONTRACTS" tab to see the deployed TrustBridge contract

### Ganache CLI
- Check the terminal where Ganache is running
- Each transaction will be logged with:
  - Transaction hash
  - Block number
  - Gas used
  - Contract method called

## Verifying Integration

1. **Check Backend Logs**
   ```
   ✓ Blockchain initialized with Ganache integration
   Loaded 1 blocks from Ganache
   ```

2. **Make a Donation**
   - Create a donation through the frontend
   - Check Ganache: You should see a new transaction
   - Block number should increment

3. **View Blockchain Explorer**
   - Navigate to the UserLanding page
   - Scroll to "Blockchain Verified Transparency" section
   - You should see all blocks including the genesis block

## Troubleshooting

### Error: "Cannot connect to Ganache"
- Ensure Ganache is running on port 7545
- Check `GANACHE_URL` in `.env` file
- Try accessing http://127.0.0.1:7545 in a browser

### Error: "Contract address not set"
- Run `python deploy_contract.py` first
- Copy the contract address to `.env` file
- Restart the Flask app

### Error: "No accounts found in Ganache"
- Restart Ganache
- Ensure Ganache has generated test accounts

### Blockchain runs without Ganache
- Check logs: Should show "⚠ Blockchain initialized without Ganache"
- Fix the Ganache connection issue
- Restart the app

## Architecture

```
┌─────────────────┐
│   Frontend      │
│  (UserLanding)  │
└────────┬────────┘
         │
         │ HTTP API
         ▼
┌─────────────────┐
│   Flask API     │
│ (blockchain.py) │
└────────┬────────┘
         │
         │ Web3.py
         ▼
┌─────────────────┐
│    Ganache      │
│  (Ethereum VM)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Smart Contract  │
│  (Solidity)     │
└─────────────────┘
```

## Smart Contract Methods

- `addBlock(index, timestamp, data, previousHash, hash, nonce)` - Add a new block
- `getBlock(index)` - Get a specific block by index
- `getBlockCount()` - Get total number of blocks
- `getLatestBlock()` - Get the most recent block

## Benefits of Ganache Integration

1. ✅ **True Blockchain**: Blocks are stored in an actual Ethereum blockchain
2. ✅ **Persistence**: Blocks survive app restarts (as long as Ganache keeps data)
3. ✅ **Transparency**: Anyone can verify blocks in Ganache
4. ✅ **Immutability**: Blockchain rules enforced by Ethereum VM
5. ✅ **Development**: Easy testing with Ganache's reset/restart features

## Production Considerations

For production deployment, consider:
- Replace Ganache with a real Ethereum network (Mainnet, Polygon, etc.)
- Use environment-specific contract addresses
- Implement proper gas management
- Add transaction error handling
- Consider using IPFS for large data storage
