import hashlib
import json
import time
from datetime import datetime
from typing import List, Dict, Any
from ganache_config import w3, get_contract, get_default_account, CONTRACT_ADDRESS


class Block:
    """Represents a single block in the blockchain"""
    
    def __init__(self, index: int, timestamp: float, data: Dict[str, Any], previous_hash: str, nonce: int = 0):
        self.index = index
        self.timestamp = timestamp
        self.data = data
        self.previous_hash = previous_hash
        self.nonce = nonce
        self.hash = self.calculate_hash()
    
    def calculate_hash(self) -> str:
        """Calculate the SHA-256 hash of the block"""
        block_string = json.dumps({
            "index": self.index,
            "timestamp": self.timestamp,
            "data": self.data,
            "previous_hash": self.previous_hash,
            "nonce": self.nonce
        }, sort_keys=True)
        return hashlib.sha256(block_string.encode()).hexdigest()
    
    def mine_block(self, difficulty: int = 2):
        """Mine the block with proof of work (difficulty = number of leading zeros)"""
        target = "0" * difficulty
        while self.hash[:difficulty] != target:
            self.nonce += 1
            self.hash = self.calculate_hash()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert block to dictionary for JSON serialization"""
        return {
            "index": self.index,
            "timestamp": self.timestamp,
            "datetime": datetime.fromtimestamp(self.timestamp).isoformat(),
            "data": self.data,
            "previous_hash": self.previous_hash,
            "hash": self.hash,
            "nonce": self.nonce
        }


class Blockchain:
    """Manages the blockchain with Ganache integration"""
    
    def __init__(self, difficulty: int = 2, use_ganache: bool = True):
        self.chain: List[Block] = []
        self.difficulty = difficulty
        # self.use_ganache = use_ganache and CONTRACT_ADDRESS is not None
        self.use_ganache = False
        if self.use_ganache:
            try:
                # Load existing blocks from Ganache
                self._load_from_ganache()
            except Exception as e:
                print(f"Warning: Could not load from Ganache: {e}")
                self.use_ganache = False
                self.create_genesis_block()
        else:
            self.create_genesis_block()
    
    def _load_from_ganache(self):
        """Load existing blocks from Ganache smart contract"""
        try:
            contract = get_contract()
            block_count = contract.functions.getBlockCount().call()
            
            if block_count == 0:
                # No blocks in Ganache, create genesis
                self.create_genesis_block()
            else:
                # Load all blocks from Ganache
                for i in range(block_count):
                    block_data = contract.functions.getBlock(i).call()
                    index, timestamp, data_str, prev_hash, block_hash, nonce = block_data
                    
                    # Parse JSON data
                    data = json.loads(data_str)
                    
                    # Create block object
                    block = Block(
                        index=index,
                        timestamp=float(timestamp),
                        data=data,
                        previous_hash=prev_hash,
                        nonce=nonce
                    )
                    block.hash = block_hash  # Use stored hash
                    self.chain.append(block)
                    
                print(f"Loaded {block_count} blocks from Ganache")
        except Exception as e:
            print(f"Error loading from Ganache: {e}")
            raise
    
    def _save_to_ganache(self, block: Block):
        """Save a block to Ganache smart contract"""
        try:
            contract = get_contract()
            account = get_default_account()
            
            # Convert data to JSON string
            data_str = json.dumps(block.data)
            
            # Send transaction to add block
            tx_hash = contract.functions.addBlock(
                block.index,
                int(block.timestamp),
                data_str,
                block.previous_hash,
                block.hash,
                block.nonce
            ).transact({'from': account})
            
            # Wait for transaction receipt
            receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
            print(f"Block #{block.index} saved to Ganache. Tx: {receipt.transactionHash.hex()}")
            
            return receipt
        except Exception as e:
            print(f"Error saving to Ganache: {e}")
            raise
    
    def create_genesis_block(self):
        """Create the first block in the chain"""
        genesis_block = Block(
            index=0,
            timestamp=time.time(),
            data={"type": "genesis", "message": "TrustBridge Blockchain Genesis Block"},
            previous_hash="0"
        )
        genesis_block.mine_block(self.difficulty)
        self.chain.append(genesis_block)
        
        if self.use_ganache:
            try:
                self._save_to_ganache(genesis_block)
            except Exception as e:
                print(f"Warning: Could not save genesis block to Ganache: {e}")
    
    def get_latest_block(self) -> Block:
        """Get the most recent block in the chain"""
        return self.chain[-1]
    
    def add_block(self, data: Dict[str, Any]) -> Block:
        """Add a new block to the chain"""
        previous_block = self.get_latest_block()
        new_block = Block(
            index=len(self.chain),
            timestamp=time.time(),
            data=data,
            previous_hash=previous_block.hash
        )
        new_block.mine_block(self.difficulty)
        self.chain.append(new_block)
        
        # Save to Ganache if enabled
        if self.use_ganache:
            try:
                self._save_to_ganache(new_block)
            except Exception as e:
                print(f"Warning: Block added locally but failed to save to Ganache: {e}")
        
        return new_block
    
    def is_chain_valid(self) -> bool:
        """Validate the entire blockchain"""
        for i in range(1, len(self.chain)):
            current_block = self.chain[i]
            previous_block = self.chain[i - 1]
            
            # Check if current block's hash is correct
            if current_block.hash != current_block.calculate_hash():
                return False
            
            # Check if previous hash matches
            if current_block.previous_hash != previous_block.hash:
                return False
        
        return True
    
    def get_chain(self) -> List[Dict[str, Any]]:
        """Get the entire chain as a list of dictionaries"""
        return [block.to_dict() for block in self.chain]
    
    def get_chain_summary(self) -> Dict[str, Any]:
        """Get blockchain statistics"""
        return {
            "total_blocks": len(self.chain),
            "is_valid": self.is_chain_valid(),
            "difficulty": self.difficulty,
            "latest_block": self.get_latest_block().to_dict(),
            "ganache_enabled": self.use_ganache,
            "ganache_url": w3.provider.endpoint_uri if self.use_ganache else None
        }


# Global blockchain instance (with Ganache integration)
try:
    trustbridge_blockchain = Blockchain(difficulty=2, use_ganache=True)
    print(f"✓ Blockchain initialized with Ganache integration")
except Exception as e:
    print(f"⚠ Blockchain initialized without Ganache: {e}")
    trustbridge_blockchain = Blockchain(difficulty=2, use_ganache=False)
