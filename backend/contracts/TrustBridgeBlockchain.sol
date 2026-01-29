// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TrustBridgeBlockchain {
    struct Block {
        uint256 index;
        uint256 timestamp;
        string data;
        string previousHash;
        string hash;
        uint256 nonce;
    }
    
    Block[] public blocks;
    uint256 public difficulty = 2;
    
    event BlockAdded(uint256 indexed index, string hash, uint256 timestamp);
    
    constructor() {
        // Create genesis block
        addBlock(
            0,
            block.timestamp,
            '{"type":"genesis","message":"TrustBridge Blockchain Genesis Block"}',
            "0",
            "",
            0
        );
    }
    
    function addBlock(
        uint256 index,
        uint256 timestamp,
        string memory data,
        string memory previousHash,
        string memory hash,
        uint256 nonce
    ) public {
        Block memory newBlock = Block({
            index: index,
            timestamp: timestamp,
            data: data,
            previousHash: previousHash,
            hash: hash,
            nonce: nonce
        });
        
        blocks.push(newBlock);
        emit BlockAdded(index, hash, timestamp);
    }
    
    function getBlock(uint256 index) public view returns (
        uint256,
        uint256,
        string memory,
        string memory,
        string memory,
        uint256
    ) {
        require(index < blocks.length, "Block does not exist");
        Block memory b = blocks[index];
        return (b.index, b.timestamp, b.data, b.previousHash, b.hash, b.nonce);
    }
    
    function getBlockCount() public view returns (uint256) {
        return blocks.length;
    }
    
    function getLatestBlock() public view returns (
        uint256,
        uint256,
        string memory,
        string memory,
        string memory,
        uint256
    ) {
        require(blocks.length > 0, "No blocks in chain");
        Block memory b = blocks[blocks.length - 1];
        return (b.index, b.timestamp, b.data, b.previousHash, b.hash, b.nonce);
    }
}
