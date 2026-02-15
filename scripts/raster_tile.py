#!/usr/bin/env python3
import sys
import rasterio
from rasterio.warp import transform_bounds, reproject, Resampling
from rasterio.windows import from_bounds
import numpy as np
from PIL import Image
import io
import mercantile
import math

def web_mercator_transform(x, y, z):
    """Calculate transform for Web Mercator tile"""
    bounds = mercantile.xy_bounds(x, y, z)
    pixel_size = (bounds.right - bounds.left) / 256
    return rasterio.transform.from_bounds(
        bounds.left, bounds.bottom, bounds.right, bounds.top, 256, 256
    )

def generate_tile(tiff_path, x, y, z, threshold=None, operator=None, min_val=None, max_val=None):
    """Generate Web Mercator tile from georeferenced TIFF with optional filtering"""
    try:
        with rasterio.open(tiff_path) as src:
            # Get tile bounds in Web Mercator
            tile_bounds = mercantile.xy_bounds(x, y, z)
            
            # Transform to source CRS
            left, bottom, right, top = transform_bounds(
                'EPSG:3857', src.crs,
                tile_bounds.left, tile_bounds.bottom,
                tile_bounds.right, tile_bounds.top
            )
            
            # Check if tile intersects raster
            if (right <= src.bounds.left or left >= src.bounds.right or 
                top <= src.bounds.bottom or bottom >= src.bounds.top):
                return create_empty_tile()
            
            # Create destination array
            dst_array = np.zeros((256, 256), dtype=np.float32)
            dst_transform = web_mercator_transform(x, y, z)
            
            # Reproject data to tile
            reproject(
                source=rasterio.band(src, 1),
                destination=dst_array,
                src_transform=src.transform,
                src_crs=src.crs,
                dst_transform=dst_transform,
                dst_crs='EPSG:3857',
                resampling=Resampling.bilinear
            )
            
            # Apply range filtering on raw data
            if min_val is not None and max_val is not None:
                dst_array = np.where((dst_array >= min_val) & (dst_array <= max_val), dst_array, 0)
            
            # Create mask for valid data after filtering
            mask = dst_array > 0
            
            if not mask.any():
                return create_empty_tile()
            
            # Apply display range if specified
            display_min = min_val if min_val is not None else 0
            display_max = max_val if max_val is not None else 2500
            
            # Normalize for visualization using display range
            normalized = np.clip((dst_array - display_min) / (display_max - display_min), 0, 1)
            normalized = np.nan_to_num(normalized, nan=0.0)
            
            # Create RGBA heat map
            rgba = np.zeros((256, 256, 4), dtype=np.uint8)
            rgba[:, :, 0] = (normalized * 255).astype(np.uint8)  # Red
            rgba[:, :, 1] = (np.sin(normalized * np.pi) * 255).astype(np.uint8)  # Green
            rgba[:, :, 2] = ((1 - normalized) * 255).astype(np.uint8)  # Blue
            rgba[:, :, 3] = np.where(mask, 200, 0)  # Alpha
            
            # Convert to PNG
            img = Image.fromarray(rgba, 'RGBA')
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            return buffer.getvalue()
            
    except Exception as e:
        print(f"Error generating tile {x}/{y}/{z}: {e}", file=sys.stderr)
        return create_empty_tile()

def create_empty_tile():
    """Create empty transparent tile"""
    img = Image.new('RGBA', (256, 256), (0, 0, 0, 0))
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    return buffer.getvalue()

if __name__ == "__main__":
    if len(sys.argv) < 5:
        sys.exit(1)
    
    tiff_path = sys.argv[1]
    x = int(sys.argv[2])
    y = int(sys.argv[3])
    z = int(sys.argv[4])
    
    # Optional parameters
    threshold = float(sys.argv[5]) if len(sys.argv) > 5 else None
    operator = sys.argv[6] if len(sys.argv) > 6 else None
    min_val = float(sys.argv[7]) if len(sys.argv) > 7 else None
    max_val = float(sys.argv[8]) if len(sys.argv) > 8 else None
    
    tile_data = generate_tile(tiff_path, x, y, z, threshold, operator, min_val, max_val)
    sys.stdout.buffer.write(tile_data)