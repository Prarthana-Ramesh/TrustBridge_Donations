# 🔗 TrustBridge Blockchain with Ganache Integration

## Overview

TrustBridge now features a **real blockchain implementation** using Ganache (Ethereum development blockchain). Every donation and fund utilization is recorded as an immutable block, viewable both in the application and in Ganache.

## 🎯 Features

- ✅ **True Blockchain**: Powered by Ethereum smart contracts on Ganache
- ✅ **Proof of Work**: Each block is mined with difficulty level 2
- ✅ **Immutable Records**: Cryptographically secured with SHA-256
- ✅ **Live Explorer**: View all blocks in real-time on UserLanding page
- ✅ **Ganache Integration**: Blocks persisted in Ganache blockchain
- ✅ **Cross-Tab Updates**: Real-time updates when donations are made

## 📋 Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This installs:
- `web3==6.11.3` - Ethereum Web3 library
- `python-dotenv` - Environment configuration
- Other existing dependencies

### 2. Start Ganache

**Option A: Ganache GUI** (Recommended)
1. Download from https://trufflesuite.com/ganache/
2. Install and launch
3. Click "Quickstart Ethereum"
4. Verify it's running on **port 7545**

**Option B: Ganache CLI**
```bash
npm install -g ganache
ganache --port 7545
```

### 3. Deploy Smart Contract

```bash
cd backend
python deploy_contract.py
```

**Expected Output:**
```
✓ Connected to Ganache at http://127.0.0.1:7545
✓ Using account: 0x...

📝 Deploying contract...
✅ Contract deployed successfully!
  Contract address: 0x1234567890abcdef...

======================================================================
IMPORTANT: Add this to your .env file:
======================================================================
CONTRACT_ADDRESS=0x1234567890abcdef...
======================================================================
```

### 4. Configure Environment

Create `.env` file in `backend/` directory:

```env
# Ganache Configuration
GANACHE_URL=http://127.0.0.1:7545
CONTRACT_ADDRESS=0x1234567890abcdef...  # Paste from step 3

# Other config
SECRET_KEY=your-secret-key
```

### 5. Start Application

```bash
# Backend
cd backend
python app.py

# Frontend (separate terminal)
cd ..
npm run dev
```

## 🔍 Viewing Blocks in Ganache

### Ganache GUI

1. **BLOCKS Tab**: See all mined blocks
   - Each block represents a donation or utilization
   - View block number, timestamp, gas used

2. **TRANSACTIONS Tab**: See all transactions
   - Each transaction is a block addition
   - View transaction hash, contract method called

3. **CONTRACTS Tab**: View deployed contract
   - Contract address
   - Balance and deployment details

### Ganache CLI

Check the terminal output:
```
Transaction: 0xabc...
Block number: 2
Gas used: 123456
```

## 📊 Architecture

```
┌──────────────────┐
│   React Frontend │ ← User views blockchain explorer
│  (UserLanding)   │
└────────┬─────────┘
         │ HTTP API
         ▼
┌──────────────────┐
│   Flask Backend  │ ← Python blockchain logic
│  (blockchain.py) │
└────────┬─────────┘
         │ Web3.py
         ▼
┌──────────────────┐
│     Ganache      │ ← Ethereum development blockchain
│  (Local network) │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Smart Contract   │ ← Solidity contract storing blocks
│   (Ethereum)     │
└──────────────────┘
```

## 📁 Key Files

### Backend

- **`blockchain.py`** - Core blockchain implementation with Ganache integration
- **`ganache_config.py`** - Ganache connection and smart contract config
- **`blockchain_routes.py`** - API endpoints for blockchain data
- **`deploy_contract.py`** - Smart contract deployment script
- **`contracts/TrustBridgeBlockchain.sol`** - Solidity smart contract
- **`GANACHE_SETUP.md`** - Detailed setup instructions

### Frontend

- **`src/pages/user/UserLanding.tsx`** - Blockchain explorer UI

### Integration Points

- **`donation_routes.py`** - Adds block on donation creation
- **`utilization_routes.py`** - Adds block on utilization creation

## 🔧 API Endpoints

### Get Blockchain
```
GET /api/blockchain/chain
```
Response:
```json
{
  "chain": [
    {
      "index": 0,
      "timestamp": 1234567890,
      "data": {"type": "genesis"},
      "hash": "0x123...",
      "previous_hash": "0"
    }
  ],
  "summary": {
    "total_blocks": 1,
    "is_valid": true,
    "ganache_enabled": true,
    "ganache_connected": true
  }
}
```

### Validate Blockchain
```
GET /api/blockchain/validate
```

### Ganache Status
```
GET /api/blockchain/ganache/status
```

## 🎨 Frontend Features

The UserLanding page now displays:

1. **Ganache Connection Status**
   - Green indicator when connected
   - Shows Ganache URL and block number

2. **Blockchain Statistics**
   - Total blocks
   - Chain validity
   - Donation count

3. **Live Block Explorer**
   - Color-coded blocks (Genesis, Donation, Utilization)
   - Transaction details
   - Hash chain visualization
   - Real-time updates every 10 seconds

## 🚀 How It Works

### 1. Block Creation (Donation Example)

```python
# When a donation is created
trustbridge_blockchain.add_block({
    "type": "donation",
    "donation_id": "123",
    "amount": 10000,
    "purpose": "Education"
})
```

### 2. Mining Process

```python
# Proof of work with difficulty 2
target = "00"  # Hash must start with "00"
while not hash.startswith(target):
    nonce += 1
    hash = calculate_hash()
```

### 3. Ganache Storage

```python
# Save to Ganache smart contract
contract.functions.addBlock(
    index, timestamp, data, prev_hash, hash, nonce
).transact({'from': account})
```

### 4. Frontend Display

```typescript
// Fetch and display every 10 seconds
const loadBlockchain = async () => {
  const res = await fetch('/api/blockchain/chain');
  const data = await res.json();
  setBlockchain(data);
};
```

## 🔐 Security Features

1. **SHA-256 Hashing**: Each block has a unique cryptographic hash
2. **Hash Chaining**: Each block contains previous block's hash
3. **Proof of Work**: Mining prevents rapid block creation
4. **Immutability**: Changing any block breaks the chain
5. **Validation**: `is_chain_valid()` detects tampering

## 🐛 Troubleshooting

### "Cannot connect to Ganache"
- Ensure Ganache is running on port 7545
- Check GANACHE_URL in .env file
- Try: `curl http://127.0.0.1:7545`

### "Contract address not set"
- Run `python deploy_contract.py`
- Copy contract address to .env
- Restart Flask app

### "Blockchain initialized without Ganache"
- Check backend console logs
- Verify Ganache connection
- Contract must be deployed

### Frontend shows "Loading blockchain data..."
- Check Flask app is running
- Verify `/api/blockchain/chain` endpoint
- Check browser console for errors

## 📝 Development Workflow

1. **Start Ganache** (keeps running)
2. **Deploy contract once** (or when reset)
3. **Start Flask app** (auto-connects to Ganache)
4. **Make donations/utilizations** (auto-adds blocks)
5. **View in Ganache** (see transactions)
6. **View in frontend** (blockchain explorer)

## 🎓 Smart Contract Details

**Contract**: `TrustBridgeBlockchain.sol`

**Methods**:
- `addBlock()` - Store a new block
- `getBlock(index)` - Retrieve a block
- `getBlockCount()` - Get total blocks
- `getLatestBlock()` - Get most recent block

**Events**:
- `BlockAdded(index, hash, timestamp)` - Emitted on new block

## 🌐 Production Considerations

For production deployment:

1. **Replace Ganache** with:
   - Ethereum Mainnet (expensive)
   - Polygon/BSC (cheaper)
   - Private Ethereum network

2. **Gas Management**:
   - Implement gas price estimation
   - Handle transaction failures
   - Add retry logic

3. **Data Storage**:
   - Use IPFS for large data
   - Store hash references on-chain

4. **Security**:
   - Secure private keys
   - Use hardware wallets
   - Implement access controls

## 📊 Monitoring

Check blockchain health:
```bash
# API status
curl http://localhost:5000/api/blockchain/ganache/status

# Chain validation
curl http://localhost:5000/api/blockchain/validate
```

## 🎉 Success Indicators

✅ Backend logs show: "✓ Blockchain initialized with Ganache integration"
✅ Ganache shows deployed contract in CONTRACTS tab
✅ Frontend displays green "Connected to Ganache" indicator
✅ Making a donation creates a new block visible in Ganache
✅ Blockchain explorer shows all blocks with transaction details

---

**Need help?** Check [GANACHE_SETUP.md](GANACHE_SETUP.md) for detailed instructions.
