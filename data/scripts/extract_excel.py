#!/usr/bin/env python3
"""
Excel price list extractor for BoxBlueBook.
Parses manufacturer Excel files and outputs normalized JSON.
"""

import pandas as pd
import numpy as np
import json
import re
import os
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime

# Add parent dir for config
sys.path.insert(0, str(Path(__file__).parent))
from config import VITOLA_MAP, WRAPPER_MAP

class ExcelExtractor:
    def __init__(self, source_dir: str, output_dir: str):
        self.source_dir = Path(source_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.stats = {"files_processed": 0, "cigars_extracted": 0, "errors": []}
    
    def parse_size(self, size_str: str) -> tuple:
        """Parse size string like '5 x 50' or '6 1/2 x 52' into (length, ring_gauge).
        
        Standard cigar sizes:
        - Length: typically 4-9 inches
        - Ring gauge: typically 30-70 (64ths of an inch)
        """
        if not size_str or pd.isna(size_str):
            return None, None
        
        size_str = str(size_str).strip().upper()
        
        # Handle various formats
        patterns = [
            r'(\d+(?:\s*\d+/\d+)?)\s*[Xx×]\s*(\d+)',  # 5 x 50, 6 1/2 x 52
            r'(\d+(?:\.\d+)?)["\']?\s*[Xx×]\s*(\d+)',  # 5" x 50
            r'(\d+)\s*/\s*(\d+)',  # 52/6 (ring/length format)
        ]
        
        def parse_num(s):
            """Parse a number that might contain fractions."""
            s = str(s).strip()
            if '/' in s:
                parts = s.split()
                if len(parts) == 2:  # "6 1/2"
                    whole = float(parts[0])
                    frac_parts = parts[1].split('/')
                    return whole + float(frac_parts[0]) / float(frac_parts[1])
                else:  # Just "1/2" or similar
                    frac_parts = s.split('/')
                    return float(frac_parts[0]) / float(frac_parts[1])
            return float(s)
        
        for pattern in patterns:
            match = re.search(pattern, size_str)
            if match:
                g1, g2 = match.groups()
                n1 = parse_num(g1)
                n2 = parse_num(g2)
                
                # Determine which is length vs ring gauge
                # Length is typically 4-9 inches, ring gauge is typically 30-70
                # The smaller number is usually the length
                if n1 < 15 and n2 >= 30:
                    return n1, int(n2)  # n1 is length
                elif n2 < 15 and n1 >= 30:
                    return n2, int(n1)  # n2 is length
                elif n1 < n2:
                    return n1, int(n2)  # Assume smaller is length
                else:
                    return n2, int(n1)
        
        return None, None
    
    def extract_vitola(self, name: str, vitola_field: str = None) -> str:
        """Extract standardized vitola name from product name or vitola field."""
        if vitola_field and not pd.isna(vitola_field):
            vitola = str(vitola_field).strip().lower()
        else:
            vitola = str(name).lower() if name else ""
        
        for key, value in VITOLA_MAP.items():
            if key in vitola:
                return value
        
        # Try to extract from name
        for key, value in VITOLA_MAP.items():
            if key in str(name).lower():
                return value
        
        return vitola_field if vitola_field and not pd.isna(vitola_field) else None
    
    def extract_wrapper(self, name: str) -> str:
        """Extract wrapper type from product name."""
        if not name:
            return None
        
        name_lower = str(name).lower()
        
        for key, value in WRAPPER_MAP.items():
            if key in name_lower:
                return value
        
        return None
    
    def extract_line(self, name: str, brand: str) -> str:
        """Try to extract product line from name."""
        if not name:
            return None
        
        name_clean = str(name).strip()
        
        # Remove brand prefix if present
        if brand:
            name_clean = re.sub(rf'^{re.escape(brand)}\s*[-–]?\s*', '', name_clean, flags=re.IGNORECASE)
        
        # Common patterns
        # "Brand - Line Vitola" or "Brand Line Vitola"
        parts = re.split(r'\s+(?:robusto|toro|churchill|corona|gordo|torpedo|belicoso|lancero)\s*', 
                        name_clean, flags=re.IGNORECASE)
        if parts and len(parts[0].strip()) > 2:
            return parts[0].strip()
        
        return None
    
    def clean_price(self, price) -> Optional[float]:
        """Clean and convert price to float."""
        if price is None or pd.isna(price):
            return None
        
        if isinstance(price, (int, float)):
            return float(price)
        
        # Remove currency symbols and commas
        price_str = re.sub(r'[$,]', '', str(price))
        try:
            return float(price_str)
        except ValueError:
            return None
    
    def extract_ausa(self, filepath: Path) -> List[Dict]:
        """Extract Altadis USA price list."""
        cigars = []
        
        df = pd.read_excel(filepath, header=2)
        
        for _, row in df.iterrows():
            brand = row.get('BRAND')
            if not brand or pd.isna(brand) or 'ACCESSORIES' in str(brand).upper():
                continue
            
            size = str(row.get('SIZE', ''))
            length, ring_gauge = self.parse_size(size)
            
            # Extract box count from packaging
            packaging = str(row.get('PACKAGING UNIT', ''))
            box_match = re.search(r'(\d+)', packaging)
            box_count = int(box_match.group(1)) if box_match else None
            
            cigar = {
                "brand": str(brand).strip(),
                "name": str(row.get('DESCRIPTION', '')).strip(),
                "size": size,
                "length": length,
                "ring_gauge": ring_gauge,
                "box_count": box_count,
                "wholesale_price": self.clean_price(row.get('NET PRICE UNIT')),
                "msrp_single": self.clean_price(row.get('MSRP CIGAR / UNIT')),
                "msrp_box": self.clean_price(row.get('MSRP BOX')),
                "upc": str(row.get('UPC EACH', '')).strip() if row.get('UPC EACH') else None,
                "sku": str(row.get('SKU', '')).strip() if row.get('SKU') else None,
                "source": "AUSA Price List 2025",
            }
            
            cigar["line"] = self.extract_line(cigar["name"], cigar["brand"])
            cigar["vitola"] = self.extract_vitola(cigar["name"])
            cigar["wrapper"] = self.extract_wrapper(cigar["name"])
            
            cigars.append(cigar)
        
        return cigars
    
    def extract_fuente(self, filepath: Path) -> List[Dict]:
        """Extract Arturo Fuente price list."""
        cigars = []
        
        df = pd.read_excel(filepath, header=None)
        
        # Find header row (contains "Item #" or "AFCC")
        header_row = None
        for i in range(20):
            row_str = ' '.join([str(v) for v in df.iloc[i].dropna().values])
            if 'Item #' in row_str or 'AFCC' in row_str:
                header_row = i
                break
        
        if header_row is None:
            header_row = 10  # Default
        
        # Read with header
        df = pd.read_excel(filepath, header=header_row)
        
        for idx, row in df.iterrows():
            # Skip if row index is less than 2 rows after header (skip subheaders)
            values = row.values
            if len(values) < 8:
                continue
            
            # First column is SKU (should be numeric or alphanumeric)
            sku = values[0]
            if pd.isna(sku):
                continue
            
            sku_str = str(sku).strip()
            # Skip if not a valid SKU (should contain digits)
            if not any(c.isdigit() for c in sku_str):
                continue
            
            try:
                name = str(values[2]).strip() if len(values) > 2 and not pd.isna(values[2]) else ""
                size = str(values[3]).strip() if len(values) > 3 and not pd.isna(values[3]) else ""
                
                # Skip empty names
                if not name or name == 'nan':
                    continue
                
                length, ring_gauge = self.parse_size(size)
                
                box_count = None
                if len(values) > 1 and not pd.isna(values[1]):
                    box_str = str(values[1])
                    box_match = re.search(r'(\d+)', box_str)
                    box_count = int(box_match.group(1)) if box_match else None
                
                # Get UPC if available
                upc_single = str(values[9]).strip() if len(values) > 9 and not pd.isna(values[9]) else None
                upc_box = str(values[10]).strip() if len(values) > 10 and not pd.isna(values[10]) else None
                
                cigar = {
                    "brand": "Arturo Fuente",
                    "name": name,
                    "size": size,
                    "length": length,
                    "ring_gauge": ring_gauge,
                    "box_count": box_count,
                    "wholesale_price": self.clean_price(values[5]) if len(values) > 5 else None,
                    "msrp_single": self.clean_price(values[6]) if len(values) > 6 else None,
                    "msrp_box": self.clean_price(values[7]) if len(values) > 7 else None,
                    "upc": upc_single,
                    "sku": sku_str,
                    "country": "Dominican Republic",
                    "source": "Arturo Fuente Price List 2025",
                }
                
                cigar["line"] = self.extract_line(name, "Arturo Fuente")
                cigar["vitola"] = self.extract_vitola(name)
                cigar["wrapper"] = self.extract_wrapper(name)
                
                cigars.append(cigar)
            except Exception as e:
                continue
        
        return cigars
    
    def extract_drew_estate(self, filepath: Path, diplomat: bool = False) -> List[Dict]:
        """Extract Drew Estate price list."""
        cigars = []
        
        try:
            # Read raw to find header row
            df_raw = pd.read_excel(filepath, sheet_name="Raw Data", header=None)
            
            # Find header row (contains U_DE_Brand, ItemName, etc.)
            header_row = None
            for i in range(10):
                row_str = ' '.join([str(v) for v in df_raw.iloc[i].dropna().values])
                if 'U_DE_Brand' in row_str or 'ItemName' in row_str:
                    header_row = i
                    break
            
            if header_row is None:
                header_row = 2
            
            df = pd.read_excel(filepath, sheet_name="Raw Data", header=header_row)
        except Exception as e:
            self.stats["errors"].append(f"{filepath.name}: {str(e)}")
            return cigars
        
        # Map column names (handle variations)
        col_map = {}
        for col in df.columns:
            col_lower = str(col).lower()
            if 'brand' in col_lower and 'sub' not in col_lower:
                col_map['brand'] = col
            elif 'sub_brand' in col_lower or 'subbrand' in col_lower:
                col_map['line'] = col
            elif 'itemname' in col_lower.replace('_', ''):
                col_map['name'] = col
            elif 'description' in col_lower:
                col_map['vitola'] = col
            elif 'size' in col_lower:
                col_map['size'] = col
            elif 'sticks' in col_lower or 'perbox' in col_lower.replace('_', ''):
                col_map['box_count'] = col
            elif col_lower == 'price':
                col_map['price'] = col
            elif 'msrp_box' in col_lower or 'msrpbox' in col_lower.replace('_', ''):
                col_map['msrp_box'] = col
            elif 'msrp_stick' in col_lower or 'msrpstick' in col_lower.replace('_', ''):
                col_map['msrp_single'] = col
            elif 'codebar' in col_lower or 'upc' in col_lower:
                col_map['upc'] = col
            elif 'itemcode' in col_lower.replace('_', ''):
                col_map['sku'] = col
        
        for _, row in df.iterrows():
            brand = row.get(col_map.get('brand', 'U_DE_Brand'))
            if not brand or pd.isna(brand):
                continue
            
            # Skip if brand looks like an index/ID rather than a name
            brand_str = str(brand).strip()
            if brand_str.isdigit() or len(brand_str) < 2:
                continue
            
            name = row.get(col_map.get('name', 'ItemName'), '')
            if not name or pd.isna(name):
                continue
            
            size = str(row.get(col_map.get('size', 'U_DE_Size'), ''))
            length, ring_gauge = self.parse_size(size)
            
            box_count = None
            box_val = row.get(col_map.get('box_count', 'U_DE_Sticks_Per_Box'))
            if box_val and not pd.isna(box_val):
                try:
                    box_count = int(float(box_val))
                except (ValueError, TypeError):
                    pass
            
            cigar = {
                "brand": brand_str,
                "line": str(row.get(col_map.get('line', 'U_DE_Sub_Brand'), '')).strip() if row.get(col_map.get('line', 'U_DE_Sub_Brand')) and not pd.isna(row.get(col_map.get('line', 'U_DE_Sub_Brand'))) else None,
                "name": str(name).strip(),
                "vitola": str(row.get(col_map.get('vitola', 'U_DE_PL_Description'), '')).strip() if row.get(col_map.get('vitola', 'U_DE_PL_Description')) and not pd.isna(row.get(col_map.get('vitola', 'U_DE_PL_Description'))) else None,
                "size": size,
                "length": length,
                "ring_gauge": ring_gauge,
                "box_count": box_count,
                "wholesale_price": self.clean_price(row.get(col_map.get('price', 'Price'))),
                "msrp_single": self.clean_price(row.get(col_map.get('msrp_single', 'MSRP_Stick'))),
                "msrp_box": self.clean_price(row.get(col_map.get('msrp_box', 'MSRP_Box'))),
                "upc": str(row.get(col_map.get('upc', 'CodeBars'), '')).strip() if row.get(col_map.get('upc', 'CodeBars')) and not pd.isna(row.get(col_map.get('upc', 'CodeBars'))) else None,
                "sku": str(row.get(col_map.get('sku', 'ItemCode'), '')).strip() if row.get(col_map.get('sku', 'ItemCode')) and not pd.isna(row.get(col_map.get('sku', 'ItemCode'))) else None,
                "country": "Nicaragua",
                "source": f"Drew Estate {'Diplomat ' if diplomat else ''}Price List",
            }
            
            if not cigar["vitola"]:
                cigar["vitola"] = self.extract_vitola(cigar["name"])
            cigar["wrapper"] = self.extract_wrapper(cigar["name"])
            
            cigars.append(cigar)
        
        return cigars
    
    def extract_jc_newman(self, filepath: Path) -> List[Dict]:
        """Extract J.C. Newman price list (multiple sheets)."""
        cigars = []
        
        origin_map = {
            "JCN DOM": "Dominican Republic",
            "JCN NIC": "Nicaragua",
            "JCN HH": "Honduras",
            "JCN TPA": "USA",
            "JCN Other": None,
        }
        
        xl = pd.ExcelFile(filepath)
        
        for sheet in xl.sheet_names:
            if sheet not in origin_map and not sheet.startswith("JCN"):
                continue
            
            country = origin_map.get(sheet)
            
            try:
                df = pd.read_excel(xl, sheet_name=sheet, header=None)
                
                # Find header row
                header_row = None
                for i in range(20):
                    row = df.iloc[i].dropna()
                    values = [str(v).lower() for v in row.values]
                    if any('item #' in v or 'item description' in v for v in values):
                        header_row = i
                        break
                
                if header_row is None:
                    continue
                
                df = pd.read_excel(xl, sheet_name=sheet, header=header_row)
                
                for _, row in df.iterrows():
                    sku = row.get('Item #')
                    if not sku or pd.isna(sku):
                        continue
                    
                    name = row.get('Item Description', '')
                    if not name or pd.isna(name):
                        continue
                    
                    size = str(row.get('Cigar Size', ''))
                    length, ring_gauge = self.parse_size(size)
                    
                    box_count = None
                    box_val = row.get('# of Cigars')
                    if box_val and not pd.isna(box_val):
                        try:
                            box_count = int(box_val)
                        except:
                            pass
                    
                    cigar = {
                        "brand": "J.C. Newman",
                        "name": str(name).strip(),
                        "size": size,
                        "length": length,
                        "ring_gauge": ring_gauge,
                        "box_count": box_count,
                        "wholesale_price": self.clean_price(row.get('Cost Per Box/Bundle')),
                        "msrp_single": self.clean_price(row.get('SRP Per Cigar')),
                        "msrp_box": self.clean_price(row.get('SRP Per Box/Bundle')),
                        "upc": str(row.get('Cigar UPC', '')).strip() if row.get('Cigar UPC') else None,
                        "sku": str(sku).strip(),
                        "country": country,
                        "source": f"J.C. Newman Price List 2025 ({sheet})",
                    }
                    
                    cigar["line"] = self.extract_line(name, "J.C. Newman")
                    cigar["vitola"] = self.extract_vitola(name)
                    cigar["wrapper"] = self.extract_wrapper(name)
                    
                    cigars.append(cigar)
            except Exception as e:
                self.stats["errors"].append(f"{filepath.name} ({sheet}): {str(e)}")
        
        return cigars
    
    def process_file(self, filename: str) -> List[Dict]:
        """Process a single Excel file."""
        filepath = self.source_dir / filename
        
        if not filepath.exists():
            self.stats["errors"].append(f"File not found: {filename}")
            return []
        
        cigars = []
        
        try:
            if "AUSA" in filename:
                cigars = self.extract_ausa(filepath)
            elif "Arturo Fuente" in filename:
                cigars = self.extract_fuente(filepath)
            elif "Drew Estate Retailer" in filename:
                cigars = self.extract_drew_estate(filepath, diplomat=False)
            elif "Drew Diplomat" in filename:
                cigars = self.extract_drew_estate(filepath, diplomat=True)
            elif "J.C. Newman" in filename:
                cigars = self.extract_jc_newman(filepath)
            else:
                self.stats["errors"].append(f"No extractor for: {filename}")
        except Exception as e:
            self.stats["errors"].append(f"{filename}: {str(e)}")
        
        return cigars
    
    def process_all(self) -> Dict:
        """Process all Excel files in source directory."""
        excel_files = list(self.source_dir.glob("*.xlsx"))
        
        all_cigars = []
        file_results = {}
        
        for filepath in excel_files:
            print(f"Processing: {filepath.name}")
            cigars = self.process_file(filepath.name)
            
            if cigars:
                # Save per-manufacturer JSON
                output_name = filepath.stem.replace(" ", "_").lower() + ".json"
                output_path = self.output_dir / output_name
                
                with open(output_path, 'w') as f:
                    json.dump(cigars, f, indent=2)
                
                file_results[filepath.name] = {
                    "status": "success",
                    "cigars_extracted": len(cigars),
                    "output_file": str(output_path),
                }
                
                all_cigars.extend(cigars)
                self.stats["files_processed"] += 1
                self.stats["cigars_extracted"] += len(cigars)
            else:
                file_results[filepath.name] = {
                    "status": "failed" if filepath.name in [e.split(":")[0] for e in self.stats["errors"]] else "no_data",
                    "cigars_extracted": 0,
                }
        
        return {
            "stats": self.stats,
            "file_results": file_results,
            "total_cigars": len(all_cigars),
        }


def main():
    source_dir = os.path.expanduser("~/Desktop/Cigar Price Lists/")
    output_dir = os.path.expanduser("~/Projects/boxbluebook/data/extracted/excel/")
    
    extractor = ExcelExtractor(source_dir, output_dir)
    results = extractor.process_all()
    
    print("\n" + "="*60)
    print("EXCEL EXTRACTION RESULTS")
    print("="*60)
    print(f"Files processed: {results['stats']['files_processed']}")
    print(f"Total cigars extracted: {results['stats']['cigars_extracted']}")
    
    if results['stats']['errors']:
        print(f"\nErrors ({len(results['stats']['errors'])}):")
        for error in results['stats']['errors']:
            print(f"  - {error}")
    
    print("\nPer-file results:")
    for filename, result in results['file_results'].items():
        status = "✓" if result["status"] == "success" else "✗"
        print(f"  {status} {filename}: {result['cigars_extracted']} cigars")
    
    # Save summary
    summary_path = os.path.expanduser("~/Projects/boxbluebook/data/reports/excel_extraction_report.json")
    os.makedirs(os.path.dirname(summary_path), exist_ok=True)
    
    results["timestamp"] = datetime.now().isoformat()
    with open(summary_path, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\nReport saved to: {summary_path}")


if __name__ == "__main__":
    main()
