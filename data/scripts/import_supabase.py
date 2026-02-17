#!/usr/bin/env python3
"""
Import cigar data into Supabase.
Requires SUPABASE_URL and SUPABASE_KEY environment variables.
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List

try:
    from supabase import create_client, Client
except ImportError:
    print("Supabase client not installed. Run: pip install supabase")
    sys.exit(1)


class SupabaseImporter:
    def __init__(self, url: str, key: str, dry_run: bool = False):
        self.client: Client = create_client(url, key)
        self.dry_run = dry_run
        self.stats = {
            "brands_inserted": 0,
            "lines_inserted": 0,
            "cigars_inserted": 0,
            "cigars_updated": 0,
            "errors": [],
        }
    
    def import_brands(self, brands: List[Dict]) -> Dict[str, str]:
        """Import brands and return mapping of slug -> id."""
        print(f"\nImporting {len(brands)} brands...")
        brand_map = {}
        
        for brand in brands:
            record = {
                "name": brand["name"],
                "slug": brand["slug"],
                "country": brand.get("country"),
            }
            
            if self.dry_run:
                print(f"  [DRY RUN] Would insert brand: {brand['name']}")
                brand_map[brand["slug"]] = brand["slug"]
                continue
            
            try:
                # Upsert based on slug
                result = self.client.table("brands").upsert(
                    record, 
                    on_conflict="slug"
                ).execute()
                
                if result.data:
                    brand_map[brand["slug"]] = result.data[0]["id"]
                    self.stats["brands_inserted"] += 1
            except Exception as e:
                self.stats["errors"].append(f"Brand {brand['name']}: {str(e)}")
        
        return brand_map
    
    def import_lines(self, lines: List[Dict], brand_map: Dict[str, str]) -> Dict[str, str]:
        """Import lines and return mapping of slug -> id."""
        print(f"\nImporting {len(lines)} lines...")
        line_map = {}
        
        for line in lines:
            brand_id = brand_map.get(line["brand_id"])
            if not brand_id:
                continue
            
            record = {
                "name": line["name"],
                "slug": line["slug"],
                "brand_id": brand_id,
            }
            
            if self.dry_run:
                print(f"  [DRY RUN] Would insert line: {line['name']}")
                line_map[line["slug"]] = line["slug"]
                continue
            
            try:
                result = self.client.table("lines").upsert(
                    record,
                    on_conflict="slug"
                ).execute()
                
                if result.data:
                    line_map[line["slug"]] = result.data[0]["id"]
                    self.stats["lines_inserted"] += 1
            except Exception as e:
                self.stats["errors"].append(f"Line {line['name']}: {str(e)}")
        
        return line_map
    
    def import_cigars(self, cigars: List[Dict], brand_map: Dict[str, str], line_map: Dict[str, str]):
        """Import cigars."""
        print(f"\nImporting {len(cigars)} cigars...")
        
        batch_size = 100
        batches = [cigars[i:i + batch_size] for i in range(0, len(cigars), batch_size)]
        
        for batch_num, batch in enumerate(batches):
            records = []
            
            for cigar in batch:
                brand_slug = cigar.get("brand", "").lower().replace(" ", "-")
                brand_id = brand_map.get(brand_slug)
                
                line_slug = f"{brand_slug}-{cigar.get('line', '').lower().replace(' ', '-')}" if cigar.get('line') else None
                line_id = line_map.get(line_slug) if line_slug else None
                
                record = {
                    "name": cigar.get("name"),
                    "slug": cigar.get("slug"),
                    "brand_id": brand_id,
                    "line_id": line_id,
                    "vitola": cigar.get("vitola"),
                    "size": cigar.get("size"),
                    "length": cigar.get("length"),
                    "ring_gauge": cigar.get("ring_gauge"),
                    "box_count": cigar.get("box_count"),
                    "wholesale_price": cigar.get("wholesale_price"),
                    "msrp_single": cigar.get("msrp_single"),
                    "msrp_box": cigar.get("msrp_box"),
                    "wrapper": cigar.get("wrapper"),
                    "country": cigar.get("country"),
                    "upc": cigar.get("upc"),
                    "sku": cigar.get("sku"),
                    "source": cigar.get("source"),
                }
                
                # Remove None values
                record = {k: v for k, v in record.items() if v is not None}
                records.append(record)
            
            if self.dry_run:
                print(f"  [DRY RUN] Would insert batch {batch_num + 1}/{len(batches)} ({len(records)} cigars)")
                self.stats["cigars_inserted"] += len(records)
                continue
            
            try:
                result = self.client.table("cigars").upsert(
                    records,
                    on_conflict="slug"
                ).execute()
                
                self.stats["cigars_inserted"] += len(result.data) if result.data else 0
                print(f"  Batch {batch_num + 1}/{len(batches)}: {len(records)} cigars")
            except Exception as e:
                self.stats["errors"].append(f"Batch {batch_num + 1}: {str(e)}")
    
    def run(self, data_dir: Path):
        """Run full import."""
        # Load data files
        print("Loading data files...")
        
        with open(data_dir / "brands.json", 'r') as f:
            brands_data = json.load(f)
            brands = brands_data.get("brands", [])
        
        with open(data_dir / "lines.json", 'r') as f:
            lines_data = json.load(f)
            lines = lines_data.get("lines", [])
        
        with open(data_dir / "master-cigars.json", 'r') as f:
            cigars_data = json.load(f)
            cigars = cigars_data.get("cigars", [])
        
        print(f"Loaded: {len(brands)} brands, {len(lines)} lines, {len(cigars)} cigars")
        
        # Import in order
        brand_map = self.import_brands(brands)
        line_map = self.import_lines(lines, brand_map)
        self.import_cigars(cigars, brand_map, line_map)
        
        # Print summary
        print("\n" + "="*60)
        print("IMPORT SUMMARY")
        print("="*60)
        print(f"Brands: {self.stats['brands_inserted']}")
        print(f"Lines: {self.stats['lines_inserted']}")
        print(f"Cigars: {self.stats['cigars_inserted']}")
        
        if self.stats["errors"]:
            print(f"\nErrors ({len(self.stats['errors'])}):")
            for error in self.stats["errors"][:10]:
                print(f"  - {error}")
            if len(self.stats["errors"]) > 10:
                print(f"  ... and {len(self.stats['errors']) - 10} more")
        
        return self.stats


def main():
    # Check for Supabase credentials
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    
    dry_run = "--dry-run" in sys.argv
    
    if not url or not key:
        print("Missing Supabase credentials.")
        print("Set SUPABASE_URL and SUPABASE_KEY environment variables.")
        print("\nRunning in dry-run mode for testing...\n")
        dry_run = True
        url = "https://example.supabase.co"
        key = "example-key"
    
    data_dir = Path(os.path.expanduser("~/Projects/boxbluebook/data"))
    
    # Check if data files exist
    required_files = ["brands.json", "lines.json", "master-cigars.json"]
    missing = [f for f in required_files if not (data_dir / f).exists()]
    
    if missing:
        print(f"Missing data files: {missing}")
        print("Run aggregate.py first to generate these files.")
        sys.exit(1)
    
    if dry_run:
        print("="*60)
        print("DRY RUN MODE - No data will be written")
        print("="*60)
    
    importer = SupabaseImporter(url, key, dry_run=dry_run)
    importer.run(data_dir)


if __name__ == "__main__":
    main()
