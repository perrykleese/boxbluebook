#!/usr/bin/env python3
"""
PDF price list extractor for BoxBlueBook.
Parses manufacturer PDF files and outputs normalized JSON.
"""

import pdfplumber
import json
import re
import os
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent))
from config import VITOLA_MAP, WRAPPER_MAP


class PDFExtractor:
    def __init__(self, source_dir: str, output_dir: str):
        self.source_dir = Path(source_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.stats = {"files_processed": 0, "cigars_extracted": 0, "errors": [], "needs_review": []}
    
    def parse_size(self, size_str: str) -> tuple:
        """Parse size string into (length, ring_gauge)."""
        if not size_str:
            return None, None
        
        size_str = str(size_str).strip().upper()
        
        patterns = [
            r'(\d+(?:\s*\d+/\d+)?)\s*[Xx×]\s*(\d+)',
            r'(\d+(?:\.\d+)?)["\']?\s*[Xx×]\s*(\d+)',
            r'(\d+)\s*[Xx×]\s*(\d+(?:\s*\d+/\d+)?)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, size_str)
            if match:
                g1, g2 = match.groups()
                
                # Determine which is length vs ring gauge
                # Ring gauge is typically 30-70, length is typically 4-9
                def parse_num(s):
                    s = s.strip()
                    if '/' in s:
                        parts = s.split()
                        if len(parts) == 2:
                            whole = float(parts[0])
                            frac = parts[1].split('/')
                            return whole + float(frac[0]) / float(frac[1])
                        else:
                            frac = s.split('/')
                            return float(frac[0]) / float(frac[1])
                    return float(s)
                
                n1 = parse_num(g1)
                n2 = parse_num(g2)
                
                # Usually format is length x ring_gauge
                if n1 < 20 and n2 >= 30:
                    return n1, int(n2)
                elif n2 < 20 and n1 >= 30:
                    return n2, int(n1)
                elif n1 < n2:
                    return n1, int(n2)
                else:
                    return n2, int(n1)
        
        return None, None
    
    def extract_vitola(self, name: str) -> str:
        """Extract standardized vitola from name."""
        if not name:
            return None
        name_lower = name.lower()
        for key, value in VITOLA_MAP.items():
            if key in name_lower:
                return value
        return None
    
    def extract_wrapper(self, name: str) -> str:
        """Extract wrapper type from name."""
        if not name:
            return None
        name_lower = name.lower()
        for key, value in WRAPPER_MAP.items():
            if key in name_lower:
                return value
        return None
    
    def clean_price(self, price_str) -> Optional[float]:
        """Clean price string to float."""
        if not price_str:
            return None
        price_str = re.sub(r'[$,\s]', '', str(price_str))
        try:
            return float(price_str)
        except ValueError:
            return None
    
    def extract_box_count(self, name: str) -> Optional[int]:
        """Extract box count from name like 'ROBUSTO (20)' or 'BOX 25'."""
        if not name:
            return None
        
        patterns = [
            r'\((\d+)\)',  # (20)
            r'BOX\s*(?:OF\s*)?(\d+)',  # BOX 20, BOX OF 20
            r'(\d+)\s*(?:CT|COUNT|PC)',  # 20CT, 20 COUNT
        ]
        
        for pattern in patterns:
            match = re.search(pattern, str(name).upper())
            if match:
                return int(match.group(1))
        
        return None
    
    def extract_lfd(self, filepath: Path) -> List[Dict]:
        """Extract La Flor Dominicana price list."""
        cigars = []
        current_line = None
        
        with pdfplumber.open(filepath) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                
                for table in tables:
                    for row in table:
                        if not row or len(row) < 4:
                            continue
                        
                        # Clean row
                        row = [str(c).strip() if c else "" for c in row]
                        
                        # Check if this is a line header (no price data)
                        if row[0] and not row[2]:  # Name but no price
                            current_line = row[0].replace('\n', ' ').strip()
                            continue
                        
                        # Skip if no name
                        name = row[0].replace('\n', ' ').strip() if row[0] else ""
                        if not name or name.upper() in ['NAME', 'PRODUCT', 'ITEM']:
                            continue
                        
                        size = row[1].replace('\n', ' ').strip() if len(row) > 1 and row[1] else ""
                        length, ring_gauge = self.parse_size(size)
                        
                        box_count = self.extract_box_count(name)
                        
                        cigar = {
                            "brand": "La Flor Dominicana",
                            "line": current_line,
                            "name": name,
                            "size": size,
                            "length": length,
                            "ring_gauge": ring_gauge,
                            "box_count": box_count,
                            "wholesale_single": self.clean_price(row[2]) if len(row) > 2 else None,
                            "wholesale_price": self.clean_price(row[3]) if len(row) > 3 else None,
                            "msrp_single": self.clean_price(row[4]) if len(row) > 4 else None,
                            "msrp_box": self.clean_price(row[5]) if len(row) > 5 else None,
                            "country": "Dominican Republic",
                            "source": "La Flor Dominicana Price List 2025",
                        }
                        
                        cigar["vitola"] = self.extract_vitola(name)
                        cigar["wrapper"] = self.extract_wrapper(name)
                        
                        # Only add if has meaningful data
                        if cigar["wholesale_price"] or cigar["msrp_box"]:
                            cigars.append(cigar)
        
        return cigars
    
    def extract_foundation(self, filepath: Path) -> List[Dict]:
        """Extract Foundation Cigar Company price list."""
        cigars = []
        current_line = None
        
        with pdfplumber.open(filepath) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                
                for table in tables:
                    for row in table:
                        if not row or len(row) < 3:
                            continue
                        
                        row = [str(c).strip() if c else "" for c in row]
                        
                        # Check for line header (contains "Corojo" or "Maduro" or brand names)
                        first_cell = row[0].lower() if row[0] else ""
                        if 'wise man' in first_cell or 'charter oak' in first_cell or 'tabernacle' in first_cell:
                            current_line = row[0].replace('\n', ' ').strip()
                            continue
                        
                        # Skip headers and empty rows
                        if not row[0] or row[0].upper() in ['SIZE', 'VITOLA', 'TOTAL', '']:
                            continue
                        
                        vitola = row[0].replace('\n', ' ').strip()
                        if not vitola or vitola.lower() in ['total', 'subtotal']:
                            continue
                        
                        size = row[1].replace('\n', ' ').strip() if len(row) > 1 and row[1] else ""
                        length, ring_gauge = self.parse_size(size)
                        
                        box_count = None
                        if len(row) > 2 and row[2]:
                            try:
                                box_count = int(row[2])
                            except ValueError:
                                pass
                        
                        wholesale_price = self.clean_price(row[3]) if len(row) > 3 else None
                        
                        if not wholesale_price:
                            continue
                        
                        cigar = {
                            "brand": "Foundation",
                            "line": current_line,
                            "name": f"{current_line} {vitola}" if current_line else vitola,
                            "vitola": vitola,
                            "size": size,
                            "length": length,
                            "ring_gauge": ring_gauge,
                            "box_count": box_count,
                            "wholesale_price": wholesale_price,
                            "country": "Nicaragua",
                            "source": "Foundation Cigar Company Order Form 2025",
                        }
                        
                        cigar["vitola"] = self.extract_vitola(vitola) or vitola
                        cigar["wrapper"] = self.extract_wrapper(current_line or "")
                        
                        cigars.append(cigar)
        
        return cigars
    
    def extract_my_father(self, filepath: Path) -> List[Dict]:
        """Extract My Father price list."""
        cigars = []
        current_line = None
        
        with pdfplumber.open(filepath) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                
                for table in tables:
                    for row in table:
                        if not row or len(row) < 4:
                            continue
                        
                        row = [str(c).strip().replace('\n', ' ') if c else "" for c in row]
                        
                        # Check for line header (e.g., "EL CENTURION Box of 20")
                        if row[0] == '' and row[1] and 'box' in row[1].lower():
                            current_line = row[1].split('Box')[0].strip()
                            # Extract box count
                            box_match = re.search(r'box\s*(?:of\s*)?(\d+)', row[1].lower())
                            current_box_count = int(box_match.group(1)) if box_match else None
                            continue
                        
                        # Check if this is a cigar row (has size like "5 x 50")
                        name = row[0]
                        if not name or not re.search(r'\d+\s*[xX×]\s*\d+', name):
                            continue
                        
                        # Parse "ROBUSTO 5 ¾ X 50" format
                        match = re.match(r'([A-Za-z\s]+)\s*(\d+(?:\s*[½¾¼⅓⅔]|\s*\d+/\d+)?\s*[xX×]\s*\d+)', name)
                        if match:
                            vitola = match.group(1).strip()
                            size = match.group(2).strip()
                        else:
                            vitola = name
                            size = ""
                        
                        # Convert special fraction characters
                        size = size.replace('½', '1/2').replace('¾', '3/4').replace('¼', '1/4')
                        
                        length, ring_gauge = self.parse_size(size)
                        
                        # Find price column
                        price = None
                        msrp = None
                        for cell in row[1:]:
                            val = self.clean_price(cell)
                            if val:
                                if not price:
                                    price = val
                                elif not msrp:
                                    msrp = val
                        
                        if not price:
                            continue
                        
                        cigar = {
                            "brand": "My Father",
                            "line": current_line,
                            "name": f"{current_line} {vitola}" if current_line else vitola,
                            "vitola": vitola,
                            "size": size,
                            "length": length,
                            "ring_gauge": ring_gauge,
                            "box_count": current_box_count if 'current_box_count' in dir() else None,
                            "wholesale_price": price,
                            "msrp_single": msrp,
                            "country": "Nicaragua",
                            "source": "My Father Price List 2025",
                        }
                        
                        cigar["vitola"] = self.extract_vitola(vitola) or vitola
                        cigar["wrapper"] = self.extract_wrapper(name)
                        
                        cigars.append(cigar)
        
        return cigars
    
    def extract_padron(self, filepath: Path) -> List[Dict]:
        """Extract Padron price list from text."""
        cigars = []
        
        with pdfplumber.open(filepath) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if not text:
                    continue
                
                lines = text.split('\n')
                current_line = None
                
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                    
                    # Check for series headers
                    if 'series' in line.lower() or 'anniversary' in line.lower():
                        if 'maduro' not in line.lower() and 'natural' not in line.lower():
                            current_line = line.strip()
                            continue
                    
                    # Look for cigar lines with prices
                    # Format: "Name Size Box# $Price $Price"
                    match = re.search(r'([A-Za-z0-9\s\'"]+)\s+(\d+\s*[xX×]\s*\d+(?:\s*\d+/\d+)?)\s+(\d+)\s+\$?([\d,]+\.?\d*)\s+\$?([\d,]+\.?\d*)', line)
                    if match:
                        name = match.group(1).strip()
                        size = match.group(2)
                        box_count = int(match.group(3))
                        
                        # Prices might be wholesale and MSRP
                        price1 = self.clean_price(match.group(4))
                        price2 = self.clean_price(match.group(5))
                        
                        length, ring_gauge = self.parse_size(size)
                        
                        cigar = {
                            "brand": "Padron",
                            "line": current_line,
                            "name": f"Padron {current_line} {name}" if current_line else f"Padron {name}",
                            "vitola": name,
                            "size": size,
                            "length": length,
                            "ring_gauge": ring_gauge,
                            "box_count": box_count,
                            "wholesale_price": price1,
                            "msrp_box": price2,
                            "country": "Nicaragua",
                            "source": "Padron Price List 2025",
                        }
                        
                        cigar["vitola"] = self.extract_vitola(name) or name
                        cigar["wrapper"] = self.extract_wrapper(line)
                        
                        cigars.append(cigar)
        
        return cigars
    
    def extract_oliva(self, filepath: Path) -> List[Dict]:
        """Extract Oliva price list."""
        cigars = []
        
        with pdfplumber.open(filepath) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                
                for table in tables:
                    current_line = None
                    
                    for row in table:
                        if not row:
                            continue
                        
                        row = [str(c).strip().replace('\n', ' ') if c else "" for c in row]
                        
                        # Process multi-column format
                        for i in range(0, len(row) - 4, 5):
                            item_no = row[i] if i < len(row) else ""
                            desc = row[i+3] if i+3 < len(row) else ""
                            price = row[i+4] if i+4 < len(row) else ""
                            
                            # Check for line headers like "Flor de Oliva (20)"
                            if item_no == "" and desc and '(' in desc and not any(c.isdigit() for c in price):
                                current_line = desc.split('(')[0].strip()
                                continue
                            
                            if not item_no or not desc or item_no.upper() == 'ITEM#':
                                continue
                            
                            # Parse description for size
                            size_match = re.search(r'(\d+(?:\s*\d+/\d+)?)\s*[xX×]\s*(\d+)', desc)
                            if size_match:
                                size = f"{size_match.group(1)} x {size_match.group(2)}"
                            else:
                                size = ""
                            
                            length, ring_gauge = self.parse_size(size)
                            
                            box_count = self.extract_box_count(current_line or "")
                            
                            wholesale = self.clean_price(price)
                            if not wholesale:
                                continue
                            
                            cigar = {
                                "brand": "Oliva",
                                "line": current_line,
                                "name": f"Oliva {current_line} {desc}" if current_line else f"Oliva {desc}",
                                "vitola": desc,
                                "size": size,
                                "length": length,
                                "ring_gauge": ring_gauge,
                                "box_count": box_count,
                                "wholesale_price": wholesale,
                                "sku": item_no,
                                "country": "Nicaragua",
                                "source": "Oliva Price Sheet 2025",
                            }
                            
                            cigar["vitola"] = self.extract_vitola(desc)
                            cigar["wrapper"] = self.extract_wrapper(desc)
                            
                            cigars.append(cigar)
        
        return cigars
    
    def extract_generic_table(self, filepath: Path, brand: str, country: str = None) -> List[Dict]:
        """Generic table extractor for simpler PDFs."""
        cigars = []
        
        with pdfplumber.open(filepath) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                
                for table in tables:
                    # Try to find header row
                    header_idx = None
                    for i, row in enumerate(table):
                        row_str = ' '.join([str(c).lower() for c in row if c])
                        if any(h in row_str for h in ['price', 'msrp', 'wholesale', 'size', 'vitola']):
                            header_idx = i
                            break
                    
                    if header_idx is None:
                        header_idx = 0
                    
                    header = [str(c).strip().lower() if c else f"col_{i}" for i, c in enumerate(table[header_idx])]
                    
                    for row in table[header_idx + 1:]:
                        if not row or len(row) < 3:
                            continue
                        
                        row = [str(c).strip() if c else "" for c in row]
                        
                        # Try to extract meaningful data
                        name = row[0] if row[0] else ""
                        if not name or len(name) < 3:
                            continue
                        
                        # Find size column
                        size = ""
                        for cell in row:
                            if re.search(r'\d+\s*[xX×]\s*\d+', cell):
                                size = cell
                                break
                        
                        length, ring_gauge = self.parse_size(size)
                        
                        # Find price columns
                        prices = []
                        for cell in row:
                            price = self.clean_price(cell)
                            if price and price > 1:
                                prices.append(price)
                        
                        if not prices:
                            continue
                        
                        cigar = {
                            "brand": brand,
                            "name": name,
                            "size": size,
                            "length": length,
                            "ring_gauge": ring_gauge,
                            "wholesale_price": prices[0] if prices else None,
                            "msrp_box": prices[1] if len(prices) > 1 else None,
                            "country": country,
                            "source": filepath.name,
                        }
                        
                        cigar["vitola"] = self.extract_vitola(name)
                        cigar["wrapper"] = self.extract_wrapper(name)
                        cigar["box_count"] = self.extract_box_count(name)
                        
                        cigars.append(cigar)
        
        return cigars
    
    def process_file(self, filename: str) -> List[Dict]:
        """Process a single PDF file."""
        filepath = self.source_dir / filename
        
        if not filepath.exists():
            self.stats["errors"].append(f"File not found: {filename}")
            return []
        
        cigars = []
        
        try:
            if "La Flor Dominicana" in filename:
                cigars = self.extract_lfd(filepath)
            elif "Foundation" in filename:
                cigars = self.extract_foundation(filepath)
            elif "My Father" in filename:
                cigars = self.extract_my_father(filepath)
            elif "Padron" in filename:
                cigars = self.extract_padron(filepath)
            elif "Oliva" in filename:
                cigars = self.extract_oliva(filepath)
            elif "Ashton" in filename:
                cigars = self.extract_generic_table(filepath, "Ashton", "Dominican Republic")
            elif "Davidoff" in filename:
                cigars = self.extract_generic_table(filepath, "Davidoff", "Dominican Republic")
            elif "Rocky Patel" in filename or "Rock Patel" in filename:
                cigars = self.extract_generic_table(filepath, "Rocky Patel", "Honduras")
            elif "Espinosa" in filename.upper():
                cigars = self.extract_generic_table(filepath, "Espinosa", "Nicaragua")
            elif "Perdomo" in filename:
                cigars = self.extract_generic_table(filepath, "Perdomo", "Nicaragua")
            elif "La Aurora" in filename:
                cigars = self.extract_generic_table(filepath, "La Aurora", "Dominican Republic")
            elif "Plasencia" in filename:
                cigars = self.extract_generic_table(filepath, "Plasencia", "Nicaragua")
            elif "Oscar Valladares" in filename:
                cigars = self.extract_generic_table(filepath, "Oscar Valladares", "Honduras")
            elif "Rojas" in filename:
                cigars = self.extract_generic_table(filepath, "Rojas", "Nicaragua")
            elif "Dapper" in filename:
                cigars = self.extract_generic_table(filepath, "Dapper", "Nicaragua")
            elif "Patina" in filename:
                cigars = self.extract_generic_table(filepath, "Patina", "Nicaragua")
            elif "Miami Cigar" in filename:
                cigars = self.extract_generic_table(filepath, "Miami Cigar", "Nicaragua")
            elif "GCC" in filename:
                cigars = self.extract_generic_table(filepath, "General Cigar", "Dominican Republic")
            elif "Forged" in filename:
                cigars = self.extract_generic_table(filepath, "Forged", "Nicaragua")
            elif "DTT" in filename:
                cigars = self.extract_generic_table(filepath, "Diesel", "Nicaragua")
            elif "AJ Fernandez" in filename:
                # This one has encoding issues, mark for review
                self.stats["needs_review"].append(filename)
                cigars = self.extract_generic_table(filepath, "AJ Fernandez", "Nicaragua")
            else:
                # Try generic extraction
                brand = filename.replace('.pdf', '').split('Price')[0].strip()
                cigars = self.extract_generic_table(filepath, brand)
                if len(cigars) < 5:
                    self.stats["needs_review"].append(filename)
        except Exception as e:
            self.stats["errors"].append(f"{filename}: {str(e)}")
        
        return cigars
    
    def process_all(self) -> Dict:
        """Process all PDF files in source directory."""
        pdf_files = list(self.source_dir.glob("*.pdf"))
        
        all_cigars = []
        file_results = {}
        
        for filepath in pdf_files:
            print(f"Processing: {filepath.name}")
            cigars = self.process_file(filepath.name)
            
            # Save per-manufacturer JSON
            output_name = filepath.stem.replace(" ", "_").lower() + ".json"
            output_path = self.output_dir / output_name
            
            with open(output_path, 'w') as f:
                json.dump(cigars, f, indent=2)
            
            status = "success" if cigars else "no_data"
            if filepath.name in self.stats["needs_review"]:
                status = "needs_review"
            elif filepath.name in [e.split(":")[0] for e in self.stats["errors"]]:
                status = "failed"
            
            file_results[filepath.name] = {
                "status": status,
                "cigars_extracted": len(cigars),
                "output_file": str(output_path),
            }
            
            if cigars:
                all_cigars.extend(cigars)
                self.stats["files_processed"] += 1
                self.stats["cigars_extracted"] += len(cigars)
        
        return {
            "stats": self.stats,
            "file_results": file_results,
            "total_cigars": len(all_cigars),
        }


def main():
    source_dir = os.path.expanduser("~/Desktop/Cigar Price Lists/")
    output_dir = os.path.expanduser("~/Projects/boxbluebook/data/extracted/pdf/")
    
    extractor = PDFExtractor(source_dir, output_dir)
    results = extractor.process_all()
    
    print("\n" + "="*60)
    print("PDF EXTRACTION RESULTS")
    print("="*60)
    print(f"Files processed: {results['stats']['files_processed']}")
    print(f"Total cigars extracted: {results['stats']['cigars_extracted']}")
    
    if results['stats']['errors']:
        print(f"\nErrors ({len(results['stats']['errors'])}):")
        for error in results['stats']['errors']:
            print(f"  - {error}")
    
    if results['stats']['needs_review']:
        print(f"\nNeeds manual review ({len(results['stats']['needs_review'])}):")
        for filename in results['stats']['needs_review']:
            print(f"  - {filename}")
    
    print("\nPer-file results:")
    for filename, result in sorted(results['file_results'].items()):
        if result["status"] == "success":
            status = "✓"
        elif result["status"] == "needs_review":
            status = "⚠"
        else:
            status = "✗"
        print(f"  {status} {filename}: {result['cigars_extracted']} cigars")
    
    # Save summary
    summary_path = os.path.expanduser("~/Projects/boxbluebook/data/reports/pdf_extraction_report.json")
    os.makedirs(os.path.dirname(summary_path), exist_ok=True)
    
    results["timestamp"] = datetime.now().isoformat()
    with open(summary_path, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\nReport saved to: {summary_path}")


if __name__ == "__main__":
    main()
