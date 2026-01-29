from web3 import Web3
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Ganache connection configuration
GANACHE_URL = os.environ.get('GANACHE_URL', 'http://127.0.0.1:7545')
CONTRACT_ADDRESS = os.environ.get('CONTRACT_ADDRESS', None)

# Connect to Ganache
w3 = Web3(Web3.HTTPProvider(GANACHE_URL))

# Load Contract ABI from compiled file
def load_contract_abi():
    """Load the ABI from the compiled contract file"""
    abi_path = os.path.join(os.path.dirname(__file__), 'contract_abi.json')
    if os.path.exists(abi_path):
        with open(abi_path, 'r') as f:
            return json.load(f)
    else:
        print("⚠️  Warning: contract_abi.json not found. Please run deploy_contract.py first.")
        return None

CONTRACT_ABI = load_contract_abi()

def get_contract():
    """Get the deployed contract instance"""
    if not CONTRACT_ADDRESS:
        print("⚠️  Warning: CONTRACT_ADDRESS not found in .env file")
        return None
    
    if not CONTRACT_ABI:
        print("⚠️  Warning: CONTRACT_ABI not loaded")
        return None
    
    try:
        return w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)
    except Exception as e:
        print(f"⚠️  Warning: Could not create contract instance: {e}")
        return None

def get_default_account():
    """Get the default account from Ganache"""
    try:
        accounts = w3.eth.accounts
        return accounts[0] if accounts else None
    except:
        return None

def is_ganache_connected():
    """Check if connected to Ganache"""
    try:
        return w3.is_connected()
    except:
        return False
