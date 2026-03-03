"""
Hash-based caching module for frequently accessed data
Uses dictionary-based lookups for O(1) performance instead of O(n) database queries
Reduces database queries and dramatically improves performance
"""
import time
import logging
from typing import Optional, List, Dict, Any, Set
from collections import defaultdict

logger = logging.getLogger(__name__)

# Hash-based indexes for ultra-fast O(1) lookups
_master_by_pharmacy_id: Dict[str, List[Dict[str, Any]]] = {}
_master_by_product_id: Dict[str, List[Dict[str, Any]]] = {}
_master_by_pharmacy_product: Dict[str, List[Dict[str, Any]]] = {}  # Key: "pharmacy_id|product_id"
_master_by_pharmacy_name: Dict[str, List[Dict[str, Any]]] = {}  # Normalized pharmacy names
_master_index_time: float = 0
_master_index_timeout: int = 300  # 5 minutes

# List cache (for backward compatibility and full data access)
_master_data_cache: Optional[List[Dict[str, Any]]] = None
_master_data_cache_time: float = 0
_master_data_cache_timeout: int = 300  # 5 minutes

# Cache for master data count
_master_count_cache: Optional[int] = None
_master_count_cache_time: float = 0

# Cache for unique values
_unique_values_cache: Optional[Dict[str, Any]] = None
_unique_values_cache_time: float = 0

def clear_master_data_cache():
    """Clear all master data caches and hash indexes - call this when master data is updated"""
    global _master_data_cache, _master_data_cache_time
    global _master_count_cache, _master_count_cache_time
    global _unique_values_cache, _unique_values_cache_time
    global _master_by_pharmacy_id, _master_by_product_id
    global _master_by_pharmacy_product, _master_by_pharmacy_name, _master_index_time
    
    _master_data_cache = None
    _master_data_cache_time = 0
    _master_count_cache = None
    _master_count_cache_time = 0
    _unique_values_cache = None
    _unique_values_cache_time = 0
    
    # Clear hash indexes
    _master_by_pharmacy_id.clear()
    _master_by_product_id.clear()
    _master_by_pharmacy_product.clear()
    _master_by_pharmacy_name.clear()
    _master_index_time = 0
    
    logger.info("Master data cache and hash indexes cleared")

def get_cached_master_data(force_refresh: bool = False) -> Optional[List[Dict[str, Any]]]:
    """
    Get cached master data or None if cache expired
    Returns None if cache is expired or doesn't exist
    """
    global _master_data_cache, _master_data_cache_time
    
    if force_refresh:
        _master_data_cache = None
        _master_data_cache_time = 0
        return None
    
    if _master_data_cache is None:
        return None
    
    # Check if cache is expired
    if time.time() - _master_data_cache_time > _master_data_cache_timeout:
        logger.debug("Master data cache expired")
        _master_data_cache = None
        _master_data_cache_time = 0
        return None
    
    logger.debug(f"Using cached master data (age: {time.time() - _master_data_cache_time:.1f}s)")
    return _master_data_cache

def build_hash_indexes(master_records: List[Dict[str, Any]]):
    """Build hash-based indexes for O(1) lookup performance"""
    global _master_by_pharmacy_id, _master_by_product_id
    global _master_by_pharmacy_product, _master_by_pharmacy_name, _master_index_time
    
    # Clear existing indexes
    _master_by_pharmacy_id.clear()
    _master_by_product_id.clear()
    _master_by_pharmacy_product.clear()
    _master_by_pharmacy_name.clear()
    
    # Build hash indexes
    for record in master_records:
        # Handle both dict formats (from cache and from ORM)
        if isinstance(record, dict):
            pharmacy_id = record.get('Generated_Pharmacy_ID') or record.get('pharmacy_id', '')
            product_id = record.get('Product_ID') or record.get('product_id', '')
            pharmacy_name = record.get('Pharmacy_Names') or record.get('pharmacy_names', '')
        else:
            # ORM object
            pharmacy_id = getattr(record, 'pharmacy_id', '') or ''
            product_id = getattr(record, 'product_id', '') or ''
            pharmacy_name = getattr(record, 'pharmacy_names', '') or ''
        
        # Index by pharmacy_id
        if pharmacy_id:
            if pharmacy_id not in _master_by_pharmacy_id:
                _master_by_pharmacy_id[pharmacy_id] = []
            _master_by_pharmacy_id[pharmacy_id].append(record)
        
        # Index by product_id
        if product_id:
            if product_id not in _master_by_product_id:
                _master_by_product_id[product_id] = []
            _master_by_product_id[product_id].append(record)
        
        # Index by pharmacy_id + product_id (composite key for exact matches)
        if pharmacy_id and product_id:
            composite_key = f"{pharmacy_id}|{product_id}"
            if composite_key not in _master_by_pharmacy_product:
                _master_by_pharmacy_product[composite_key] = []
            _master_by_pharmacy_product[composite_key].append(record)
        
        # Index by pharmacy_name (normalized for fuzzy matching)
        if pharmacy_name:
            normalized_name = pharmacy_name.lower().strip()
            if normalized_name not in _master_by_pharmacy_name:
                _master_by_pharmacy_name[normalized_name] = []
            _master_by_pharmacy_name[normalized_name].append(record)
    
    _master_index_time = time.time()
    logger.info(f"Built hash indexes: {len(_master_by_pharmacy_id)} pharmacies, "
                f"{len(_master_by_product_id)} products, "
                f"{len(_master_by_pharmacy_product)} composite keys")

def get_master_by_pharmacy_id(pharmacy_id: str) -> List[Dict[str, Any]]:
    """Get master records by pharmacy_id - O(1) hash lookup"""
    if time.time() - _master_index_time > _master_index_timeout:
        return []  # Index expired
    return _master_by_pharmacy_id.get(pharmacy_id, [])

def get_master_by_product_id(product_id: str) -> List[Dict[str, Any]]:
    """Get master records by product_id - O(1) hash lookup"""
    if time.time() - _master_index_time > _master_index_timeout:
        return []
    return _master_by_product_id.get(product_id, [])

def get_master_by_pharmacy_product(pharmacy_id: str, product_id: str) -> List[Dict[str, Any]]:
    """Get master records by pharmacy_id + product_id - O(1) hash lookup"""
    if time.time() - _master_index_time > _master_index_timeout:
        return []
    composite_key = f"{pharmacy_id}|{product_id}"
    return _master_by_pharmacy_product.get(composite_key, [])

def get_master_by_pharmacy_name(pharmacy_name: str) -> List[Dict[str, Any]]:
    """Get master records by pharmacy_name (normalized) - O(1) hash lookup"""
    if time.time() - _master_index_time > _master_index_timeout:
        return []
    normalized = pharmacy_name.lower().strip()
    return _master_by_pharmacy_name.get(normalized, [])

def set_master_data_cache(data: List[Dict[str, Any]]):
    """Set master data cache and build hash indexes"""
    global _master_data_cache, _master_data_cache_time
    
    _master_data_cache = data
    _master_data_cache_time = time.time()
    
    # Build hash indexes for fast lookups
    build_hash_indexes(data)
    
    logger.info(f"Cached {len(data)} master data records with hash indexes")

def get_cached_master_count(force_refresh: bool = False) -> Optional[int]:
    """Get cached master data count"""
    global _master_count_cache, _master_count_cache_time
    
    if force_refresh:
        _master_count_cache = None
        _master_count_cache_time = 0
        return None
    
    if _master_count_cache is None:
        return None
    
    # Cache count for shorter time (1 minute)
    if time.time() - _master_count_cache_time > 60:
        _master_count_cache = None
        _master_count_cache_time = 0
        return None
    
    return _master_count_cache

def set_master_count_cache(count: int):
    """Set master data count cache"""
    global _master_count_cache, _master_count_cache_time
    _master_count_cache = count
    _master_count_cache_time = time.time()

def get_cached_unique_values(force_refresh: bool = False) -> Optional[Dict[str, Any]]:
    """Get cached unique values"""
    global _unique_values_cache, _unique_values_cache_time
    
    if force_refresh:
        _unique_values_cache = None
        _unique_values_cache_time = 0
        return None
    
    if _unique_values_cache is None:
        return None
    
    # Cache unique values for 2 minutes
    if time.time() - _unique_values_cache_time > 120:
        _unique_values_cache = None
        _unique_values_cache_time = 0
        return None
    
    return _unique_values_cache

def set_unique_values_cache(data: Dict[str, Any]):
    """Set unique values cache"""
    global _unique_values_cache, _unique_values_cache_time
    _unique_values_cache = data
    _unique_values_cache_time = time.time()
