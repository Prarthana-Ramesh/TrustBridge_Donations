"""
TrustBridge Blockchain - Ganache Deployment Script

This script compiles and deploys the TrustBridge smart contract to Ganache.
Make sure Ganache is running before executing this script.

Usage:
    python deploy_contract.py
"""

from web3 import Web3
import json
import os
from solcx import compile_source, install_solc

def compile_contract():
    """Compile the Solidity contract"""
    print("\n📦 Compiling Solidity contract...")
    
    # Install Solidity compiler (0.8.0)
    try:
        install_solc('0.8.0')
        print("  ✓ Solidity compiler installed")
    except:
        print("  ✓ Solidity compiler already installed")
    
    # Read contract source
    contract_path = os.path.join(os.path.dirname(__file__), 'contracts', 'TrustBridgeBlockchain.sol')
    with open(contract_path, 'r') as file:
        contract_source = file.read()
    
    # Compile
    compiled_sol = compile_source(
        contract_source,
        output_values=['abi', 'bin'],
        solc_version='0.8.0'
    )
    
    # Get contract interface
    contract_id, contract_interface = compiled_sol.popitem()
    print(f"  ✓ Contract compiled successfully")
    
    return contract_interface['abi'], contract_interface['bin']

def deploy_contract():
    """Deploy the TrustBridge smart contract to Ganache"""
    
    print("\n" + "="*70)
    print(" TrustBridge Blockchain - Smart Contract Deployment ")
    print("="*70)
    
    # Connect to Ganache
    GANACHE_URL = 'http://127.0.0.1:7545'
    w3 = Web3(Web3.HTTPProvider(GANACHE_URL))
    
    if not w3.is_connected():
        print(f"\n❌ Error: Cannot connect to Ganache at {GANACHE_URL}")
        print("Please ensure Ganache is running on port 7545")
        return None
    
    print(f"\n✓ Connected to Ganache at {GANACHE_URL}")
    
    # Get accounts
    accounts = w3.eth.accounts
    if not accounts:
        print("❌ Error: No accounts found in Ganache")
        return None
    
    deployer_account = accounts[0]
    balance = w3.eth.get_balance(deployer_account)
    print(f"✓ Using account: {deployer_account}")
    print(f"  Balance: {w3.from_wei(balance, 'ether')} ETH")
    
    # Compile contract
    contract_abi, contract_bytecode = compile_contract()
    
    # Create contract instance
    TrustBridgeContract = w3.eth.contract(
        abi=contract_abi,
        bytecode=contract_bytecode
    )
    
    # Deploy contract
    print("\n📝 Deploying contract...")
    try:
        # Estimate gas
        gas_estimate = TrustBridgeContract.constructor().estimate_gas({'from': deployer_account})
        print(f"  Estimated gas: {gas_estimate}")
        
        # Build transaction
        tx_hash = TrustBridgeContract.constructor().transact({'from': deployer_account})
        print(f"  Transaction hash: {tx_hash.hex()}")
        
        # Wait for transaction receipt
        print("  Waiting for transaction to be mined...")
        tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        contract_address = tx_receipt.contractAddress
        print(f"\n✅ Contract deployed successfully!")
        print(f"  Contract address: {contract_address}")
        print(f"  Block number: {tx_receipt.blockNumber}")
        print(f"  Gas used: {tx_receipt.gasUsed}")
        
        # Save contract ABI to file
        abi_path = os.path.join(os.path.dirname(__file__), 'contract_abi.json')
        with open(abi_path, 'w') as f:
            json.dump(contract_abi, f, indent=2)
        print(f"\n💾 Contract ABI saved to contract_abi.json")
        
        # Save contract address to .env file
        env_path = os.path.join(os.path.dirname(__file__), '.env')
        
        # Read existing .env or create new
        env_content = ""
        if os.path.exists(env_path):
            with open(env_path, 'r') as f:
                env_content = f.read()
        
        # Update or add CONTRACT_ADDRESS
        if 'CONTRACT_ADDRESS=' in env_content:
            lines = env_content.split('\n')
            for i, line in enumerate(lines):
                if line.startswith('CONTRACT_ADDRESS='):
                    lines[i] = f'CONTRACT_ADDRESS={contract_address}'
            env_content = '\n'.join(lines)
        else:
            if env_content and not env_content.endswith('\n'):
                env_content += '\n'
            env_content += f'CONTRACT_ADDRESS={contract_address}\n'
        
        # Write back to .env
        with open(env_path, 'w') as f:
            f.write(env_content)
        
        print(f"💾 Contract address saved to .env file")
        
        # Verify deployment by calling a contract method
        contract = w3.eth.contract(address=contract_address, abi=contract_abi)
        block_count = contract.functions.getBlockCount().call()
        print(f"\n🔍 Verification: Block count = {block_count}")
        
        print("\n" + "="*70)
        print("✅ DEPLOYMENT SUCCESSFUL")
        print("="*70)
        print("\nNext steps:")
        print("1. Restart your Flask application")
        print("2. The blockchain will automatically connect to Ganache")
        print("3. Check the blockchain explorer on the frontend")
        print("\n" + "="*70)
        
        return contract_address
        
    except Exception as e:
        print(f"\n❌ Error deploying contract: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    try:
        address = deploy_contract()
        if address:
            print(f"\n✅ Success! Contract deployed at {address}")
            exit(0)
        else:
            print("\n❌ Deployment failed. Please check the errors above.")
            exit(1)
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
