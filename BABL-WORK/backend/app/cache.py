"""
Caching module for frequently accessed data
Reduces database queries and improves performance
"""
import time
import logging
from typing import Optional, List, Dict, Any
from functools import lru_cache

logger = logging.getLogger(__name__)

# In-memory cache for master data
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
    """Clear master data cache - call this when master data is updated"""
    global _master_data_cache, _master_data_cache_time
    global _master_count_cache, _master_count_cache_time
    global _unique_values_cache, _unique_values_cache_time
    
    _master_data_cache = None
    _master_data_cache_time = 0
    _master_count_cache = None
    _master_count_cache_time = 0
    _unique_values_cache = None
    _unique_values_cache_time = 0
    logger.info("Master data cache cleared")

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

def set_master_data_cache(data: List[Dict[str, Any]]):
    """Set master data cache"""
    global _master_data_cache, _master_data_cache_time
    _master_data_cache = data
    _master_data_cache_time = time.time()
    logger.info(f"Cached {len(data)} master data records")

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
