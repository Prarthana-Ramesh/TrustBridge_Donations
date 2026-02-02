from flask import Blueprint, jsonify
from blockchain import trustbridge_blockchain
from ganache_config import w3, CONTRACT_ADDRESS

blockchain_bp = Blueprint("blockchain", __name__, url_prefix="/api/blockchain")


@blockchain_bp.route("/chain", methods=["GET"])
def get_blockchain():
    """Get the entire blockchain"""
    summary = trustbridge_blockchain.get_chain_summary()
    
    return jsonify({
        "chain": trustbridge_blockchain.get_chain(),
        "summary": summary
    })


@blockchain_bp.route("/validate", methods=["GET"])
def validate_blockchain():
    """Validate the blockchain integrity"""
    is_valid = trustbridge_blockchain.is_chain_valid()
    return jsonify({
        "is_valid": is_valid,
        "message": "Blockchain is valid" if is_valid else "Blockchain has been tampered with"
    })


@blockchain_bp.route("/latest", methods=["GET"])
def get_latest_block():
    """Get the latest block in the chain"""
    return jsonify({
        "block": trustbridge_blockchain.get_latest_block().to_dict()
    })


@blockchain_bp.route("/ganache/status", methods=["GET"])
def ganache_status():
    """Get Ganache connection status (always disabled)"""
    return jsonify({
        "enabled": False,
        "connected": False,
        "message": "Ganache integration is disabled. Running in local blockchain mode."
    })
