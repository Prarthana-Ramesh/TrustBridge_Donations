from flask import Blueprint, jsonify
from blockchain import trustbridge_blockchain
from ganache_config import w3, CONTRACT_ADDRESS

blockchain_bp = Blueprint("blockchain", __name__, url_prefix="/api/blockchain")


@blockchain_bp.route("/chain", methods=["GET"])
def get_blockchain():
    """Get the entire blockchain"""
    summary = trustbridge_blockchain.get_chain_summary()
    
    # Add Ganache connection info
    if trustbridge_blockchain.use_ganache:
        try:
            summary["ganache_connected"] = w3.is_connected()
            summary["ganache_block_number"] = w3.eth.block_number
            summary["ganache_accounts"] = len(w3.eth.accounts)
        except:
            summary["ganache_connected"] = False
    
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
        "message": "Blockchain is valid" if is_valid else "Blockchain has been tampered with",
        "ganache_enabled": trustbridge_blockchain.use_ganache,
        "ganache_connected": w3.is_connected() if trustbridge_blockchain.use_ganache else False
    })


@blockchain_bp.route("/latest", methods=["GET"])
def get_latest_block():
    """Get the latest block in the chain"""
    return jsonify({
        "block": trustbridge_blockchain.get_latest_block().to_dict(),
        "ganache_enabled": trustbridge_blockchain.use_ganache
    })


@blockchain_bp.route("/ganache/status", methods=["GET"])
def ganache_status():
    """Get Ganache connection status"""
    if not trustbridge_blockchain.use_ganache:
        return jsonify({
            "enabled": False,
            "message": "Ganache integration is disabled. Running in local mode."
        })
    
    try:
        connected = w3.is_connected()
        status = {
            "enabled": True,
            "connected": connected,
            "url": w3.provider.endpoint_uri if hasattr(w3.provider, 'endpoint_uri') else None,
            "contract_address": CONTRACT_ADDRESS
        }
        
        if connected:
            status["network_id"] = w3.eth.chain_id
            status["block_number"] = w3.eth.block_number
            status["accounts_count"] = len(w3.eth.accounts)
            status["message"] = "Connected to Ganache successfully"
        else:
            status["message"] = "Ganache URL configured but not connected"
            
        return jsonify(status)
    except Exception as e:
        return jsonify({
            "enabled": True,
            "connected": False,
            "error": str(e),
            "message": f"Error connecting to Ganache: {str(e)}"
        }), 500
