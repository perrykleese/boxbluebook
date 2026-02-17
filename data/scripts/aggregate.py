#!/usr/bin/env python3
"""
Aggregates all extracted cigar data into master JSON files.
Creates: master-cigars.json, brands.json, lines.json
"""

import json
import os
import re
import hashlib
from pathlib import Path
from typing import Dict, List, Set
from datetime import datetime
from collections import defaultdict


def generate_slug(text: str) -> str:
    """Generate URL-friendly slug from text."""
    if not text:
        return ""
    slug = text.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    return slug.strip('-')


def generate_id(cigar: Dict) -> str:
    """Generate unique ID for a cigar based on its key attributes."""
    key = f"{cigar.get('brand', '')}-{cigar.get('name', '')}-{cigar.get('size', '')}"
    return hashlib.md5(key.encode()).hexdigest()[:12]


def normalize_brand(brand: str) -> str:
    """Normalize brand name."""
    if not brand:
        return ""
    
    brand = str(brand).strip()
    
    # Common normalizations
    normalizations = {
        "1875 BY ROMEO Y JULIETA": "Romeo y Julieta",
        "ROMEO Y JULIETA": "Romeo y Julieta",
        "H. UPMANN": "H. Upmann",
        "MONTECRISTO": "Montecristo",
        "PUNCH": "Punch",
        "HOYO DE MONTERREY": "Hoyo de Monterrey",
        "ARTURO FUENTE": "Arturo Fuente",
        "AF": "Arturo Fuente",
        "LA FLOR DOMINICANA": "La Flor Dominicana",
        "LFD": "La Flor Dominicana",
        "MY FATHER": "My Father",
        "DREW ESTATE": "Drew Estate",
        "J.C. NEWMAN": "J.C. Newman",
        "JCN": "J.C. Newman",
        "CUESTA-REY": "Cuesta-Rey",
        "CR": "Cuesta-Rey",
        "OLIVA": "Oliva",
        "PADRON": "Padron",
        "PADRÓN": "Padron",
        "ROCKY PATEL": "Rocky Patel",
        "AJ FERNANDEZ": "AJ Fernandez",
        "A.J. FERNANDEZ": "AJ Fernandez",
        "FOUNDATION": "Foundation",
        "ASHTON": "Ashton",
        "DAVIDOFF": "Davidoff",
        "PERDOMO": "Perdomo",
        "ESPINOSA": "Espinosa",
        "PLASENCIA": "Plasencia",
        "LA AURORA": "La Aurora",
        "ACID": "Acid",
        "LIGA PRIVADA": "Liga Privada",
        "UNDERCROWN": "Undercrown",
        "HERRERA ESTELI": "Herrera Esteli",
        "DEADWOOD": "Deadwood",
    }
    
    brand_upper = brand.upper()
    for key, value in normalizations.items():
        if key in brand_upper:
            return value
    
    # Title case if not found
    return brand.title()


def validate_and_fix_size(cigar: Dict) -> Dict:
    """Validate and fix cigar size data."""
    length = cigar.get('length')
    ring_gauge = cigar.get('ring_gauge')
    size_str = cigar.get('size', '')
    
    # Valid ranges
    # Length: 3.5 - 9 inches (most cigars)
    # Ring gauge: 20 - 70 (most cigars)
    
    if length and ring_gauge:
        # If values are swapped (length > 15 and ring < 15)
        if length > 15 and ring_gauge < 15:
            cigar['length'], cigar['ring_gauge'] = ring_gauge, int(length)
        # If both seem like ring gauges (both > 30)
        elif length > 30 and ring_gauge > 30:
            # Try to re-parse from size string
            import re
            match = re.search(r'(\d+\.?\d*)\s*[xX×]\s*(\d+)', str(size_str))
            if match:
                n1, n2 = float(match.group(1)), float(match.group(2))
                # The one closer to typical length range (4-8) is probably length
                if abs(n1 - 6) < abs(n2 - 6):
                    cigar['length'] = n1
                    cigar['ring_gauge'] = int(n2)
                else:
                    cigar['length'] = n2
                    cigar['ring_gauge'] = int(n1)
        # Clear obviously invalid data
        elif length > 12 or ring_gauge < 15 or ring_gauge > 80:
            cigar['length'] = None
            cigar['ring_gauge'] = None
    
    return cigar


def deduplicate_cigars(cigars: List[Dict]) -> List[Dict]:
    """Remove duplicate cigars based on key attributes."""
    seen = {}
    unique = []
    
    for cigar in cigars:
        # Validate size data
        cigar = validate_and_fix_size(cigar)
        
        # Create dedup key
        key = (
            normalize_brand(cigar.get('brand', '')).lower(),
            cigar.get('name', '').lower(),
            cigar.get('size', '').lower(),
        )
        
        if key not in seen:
            seen[key] = cigar
            unique.append(cigar)
        else:
            # Merge data from duplicate (prefer non-null values)
            existing = seen[key]
            for field, value in cigar.items():
                if value and not existing.get(field):
                    existing[field] = value
    
    return unique


def build_taxonomy(cigars: List[Dict]) -> tuple:
    """Build brand and line taxonomy from cigars."""
    brands = {}
    lines = {}
    
    for cigar in cigars:
        brand_name = normalize_brand(cigar.get('brand', ''))
        if not brand_name:
            continue
        
        brand_slug = generate_slug(brand_name)
        
        if brand_slug not in brands:
            brands[brand_slug] = {
                "id": brand_slug,
                "name": brand_name,
                "slug": brand_slug,
                "country": cigar.get('country'),
                "cigar_count": 0,
                "lines": [],
            }
        
        brands[brand_slug]["cigar_count"] += 1
        
        # Update country if not set
        if not brands[brand_slug]["country"] and cigar.get('country'):
            brands[brand_slug]["country"] = cigar.get('country')
        
        # Process line
        line_name = cigar.get('line')
        if line_name:
            line_slug = f"{brand_slug}-{generate_slug(line_name)}"
            
            if line_slug not in lines:
                lines[line_slug] = {
                    "id": line_slug,
                    "name": line_name,
                    "slug": line_slug,
                    "brand_id": brand_slug,
                    "brand_name": brand_name,
                    "cigar_count": 0,
                }
            
            lines[line_slug]["cigar_count"] += 1
            
            if line_slug not in brands[brand_slug]["lines"]:
                brands[brand_slug]["lines"].append(line_slug)
    
    return list(brands.values()), list(lines.values())


def process_all():
    """Main aggregation process."""
    base_dir = Path(os.path.expanduser("~/Projects/boxbluebook/data"))
    extracted_dir = base_dir / "extracted"
    output_dir = base_dir
    
    all_cigars = []
    sources = defaultdict(int)
    
    # Load all extracted JSON files
    for subdir in ["excel", "pdf"]:
        dir_path = extracted_dir / subdir
        if not dir_path.exists():
            continue
        
        for json_file in dir_path.glob("*.json"):
            try:
                with open(json_file, 'r') as f:
                    cigars = json.load(f)
                    
                    for cigar in cigars:
                        # Normalize brand
                        cigar['brand'] = normalize_brand(cigar.get('brand', ''))
                        
                        # Generate ID and slug
                        cigar['id'] = generate_id(cigar)
                        cigar['slug'] = generate_slug(f"{cigar['brand']} {cigar.get('name', '')}")
                        
                        sources[cigar.get('source', 'unknown')] += 1
                    
                    all_cigars.extend(cigars)
                    print(f"  Loaded {len(cigars)} cigars from {json_file.name}")
            except Exception as e:
                print(f"  Error loading {json_file.name}: {e}")
    
    print(f"\nTotal raw cigars: {len(all_cigars)}")
    
    # Deduplicate
    unique_cigars = deduplicate_cigars(all_cigars)
    print(f"Unique cigars after dedup: {len(unique_cigars)}")
    
    # Build taxonomy
    brands, lines = build_taxonomy(unique_cigars)
    print(f"Unique brands: {len(brands)}")
    print(f"Unique lines: {len(lines)}")
    
    # Save master files
    timestamp = datetime.now().isoformat()
    
    master_cigars = {
        "metadata": {
            "generated": timestamp,
            "total_cigars": len(unique_cigars),
            "total_brands": len(brands),
            "total_lines": len(lines),
            "sources": dict(sources),
        },
        "cigars": unique_cigars,
    }
    
    with open(output_dir / "master-cigars.json", 'w') as f:
        json.dump(master_cigars, f, indent=2)
    print(f"\nSaved: master-cigars.json ({len(unique_cigars)} cigars)")
    
    with open(output_dir / "brands.json", 'w') as f:
        json.dump({"brands": brands}, f, indent=2)
    print(f"Saved: brands.json ({len(brands)} brands)")
    
    with open(output_dir / "lines.json", 'w') as f:
        json.dump({"lines": lines}, f, indent=2)
    print(f"Saved: lines.json ({len(lines)} lines)")
    
    # Generate summary report
    report = {
        "timestamp": timestamp,
        "totals": {
            "cigars": len(unique_cigars),
            "brands": len(brands),
            "lines": len(lines),
            "raw_records": len(all_cigars),
            "duplicates_removed": len(all_cigars) - len(unique_cigars),
        },
        "by_brand": {b["name"]: b["cigar_count"] for b in sorted(brands, key=lambda x: -x["cigar_count"])[:20]},
        "sources": dict(sources),
        "coverage": {
            "with_msrp": sum(1 for c in unique_cigars if c.get('msrp_single') or c.get('msrp_box')),
            "with_wholesale": sum(1 for c in unique_cigars if c.get('wholesale_price')),
            "with_size": sum(1 for c in unique_cigars if c.get('length') and c.get('ring_gauge')),
            "with_vitola": sum(1 for c in unique_cigars if c.get('vitola')),
            "with_wrapper": sum(1 for c in unique_cigars if c.get('wrapper')),
            "with_country": sum(1 for c in unique_cigars if c.get('country')),
        },
    }
    
    reports_dir = base_dir / "reports"
    reports_dir.mkdir(exist_ok=True)
    
    with open(reports_dir / "aggregation_report.json", 'w') as f:
        json.dump(report, f, indent=2)
    
    # Print summary
    print("\n" + "="*60)
    print("AGGREGATION SUMMARY")
    print("="*60)
    print(f"Total cigars: {report['totals']['cigars']}")
    print(f"Total brands: {report['totals']['brands']}")
    print(f"Total lines: {report['totals']['lines']}")
    print(f"Duplicates removed: {report['totals']['duplicates_removed']}")
    
    print("\nTop 10 brands by cigar count:")
    for brand, count in list(report['by_brand'].items())[:10]:
        print(f"  {brand}: {count}")
    
    print("\nData coverage:")
    for field, count in report['coverage'].items():
        pct = count / report['totals']['cigars'] * 100
        print(f"  {field}: {count} ({pct:.1f}%)")
    
    return report


if __name__ == "__main__":
    process_all()
