"""
Configuration for cigar price list extraction.
Maps each manufacturer file to its parsing schema.
"""

# Standard BoxBlueBook schema
CIGAR_SCHEMA = {
    "brand": str,           # Manufacturer brand (e.g., "My Father")
    "line": str,            # Product line (e.g., "Le Bijou 1922")
    "name": str,            # Full cigar name
    "vitola": str,          # Vitola name (e.g., "Robusto", "Toro")
    "size": str,            # Size string (e.g., "5 x 50")
    "length": float,        # Length in inches
    "ring_gauge": int,      # Ring gauge
    "box_count": int,       # Cigars per box
    "wholesale_price": float,  # Wholesale box price
    "msrp_single": float,   # MSRP per cigar
    "msrp_box": float,      # MSRP per box
    "wrapper": str,         # Wrapper type (if available)
    "country": str,         # Country of origin
    "upc": str,             # UPC code (if available)
    "sku": str,             # Manufacturer SKU
}

# File configurations
EXCEL_CONFIGS = {
    "AUSA Price List 2025.xlsx": {
        "type": "excel",
        "header_row": 2,
        "sheet": 0,
        "mapping": {
            "brand": "BRAND",
            "name": "DESCRIPTION",
            "size": "SIZE",
            "box_count": lambda df: df["PACKAGING UNIT"].str.extract(r'(\d+)')[0].astype(float),
            "wholesale_price": "NET PRICE UNIT",
            "msrp_single": "MSRP CIGAR / UNIT",
            "msrp_box": "MSRP BOX",
            "upc": "UPC EACH",
            "sku": "SKU",
        },
        "brand_name": "Altadis USA",
        "brands": ["Romeo y Julieta", "Montecristo", "H. Upmann", "Punch", "Hoyo de Monterrey"],
    },
    
    "Arturo Fuente Price List w Special Cigars and UPCs - 2025.xlsx": {
        "type": "excel",
        "header_row": 10,
        "sheet": 0,
        "mapping": {
            "sku": 0,  # Column index
            "box_count": 1,
            "name": 2,
            "size": 3,
            "wholesale_single": 4,
            "wholesale_price": 5,
            "msrp_single": 6,
            "msrp_box": 7,
        },
        "brand_name": "Arturo Fuente",
    },
    
    "Drew Estate Retailer Price List.xlsx": {
        "type": "excel",
        "sheet": "Raw Data",
        "header_row": 2,
        "mapping": {
            "brand": "U_DE_Brand",
            "line": "U_DE_Sub_Brand",
            "name": "ItemName",
            "vitola": "U_DE_PL_Description",
            "size": "U_DE_Size",
            "box_count": "U_DE_Sticks_Per_Box",
            "wholesale_price": "Price",
            "msrp_box": "MSRP_Box",
            "msrp_single": "MSRP_Stick",
            "upc": "CodeBars",
            "sku": "ItemCode",
        },
        "brand_name": "Drew Estate",
    },
    
    "Drew Diplomat Exclusive Products Price List.xlsx": {
        "type": "excel",
        "sheet": "Raw Data",
        "header_row": 2,
        "mapping": {
            "brand": "U_DE_Brand",
            "line": "U_DE_Sub_Brand",
            "name": "ItemName",
            "vitola": "U_DE_PL_Description",
            "size": "U_DE_Size",
            "box_count": "U_DE_Sticks_Per_Box",
            "wholesale_price": "Price",
            "msrp_box": "MSRP_Box",
            "msrp_single": "MSRP_Stick",
            "upc": "CodeBars",
            "sku": "ItemCode",
        },
        "brand_name": "Drew Estate (Diplomat)",
    },
    
    "J.C. Newman Price List and UPC - 2025.xlsx": {
        "type": "excel",
        "sheets": ["JCN DOM", "JCN NIC", "JCN HH", "JCN TPA", "JCN Other"],
        "header_row": 11,
        "mapping": {
            "sku": "Item #",
            "box_count": "# of Cigars",
            "name": "Item Description",
            "size": "Cigar Size",
            "wholesale_single": "Cost Per Cigar",
            "wholesale_price": "Cost Per Box/Bundle",
            "msrp_single": "SRP Per Cigar",
            "msrp_box": "SRP Per Box/Bundle",
            "upc": "Cigar UPC",
        },
        "brand_name": "J.C. Newman",
        "origin_map": {
            "JCN DOM": "Dominican Republic",
            "JCN NIC": "Nicaragua",
            "JCN HH": "Honduras",
            "JCN TPA": "USA (Tampa)",
        },
    },
}

PDF_CONFIGS = {
    "My Father Price List 2025.pdf": {
        "type": "pdf",
        "brand_name": "My Father",
        "country": "Nicaragua",
        "table_structure": "mixed",  # Tables with headers in cells
        "lines": ["El Centurion", "Flor de las Antillas", "Le Bijou 1922", "La Opulencia", 
                  "La Gran Oferta", "Judge", "La Promesa", "Tabacos Baez"],
    },
    
    "Padron Price List - 2025.pdf": {
        "type": "pdf",
        "brand_name": "Padron",
        "country": "Nicaragua",
        "table_structure": "text",  # Extract from text, not tables
        "lines": ["1964 Anniversary Series", "1926 Series", "Family Reserve", "Damaso", "Classic"],
    },
    
    "La Flor Dominicana Price List - 2025.pdf": {
        "type": "pdf",
        "brand_name": "La Flor Dominicana",
        "country": "Dominican Republic",
        "table_structure": "clean_table",
        "col_mapping": {
            0: "name",
            1: "size",
            2: "wholesale_single",
            3: "wholesale_price",
            4: "msrp_single",
            5: "msrp_box",
        },
    },
    
    "Foundation Cigar Company Order Form 2025-.pdf": {
        "type": "pdf",
        "brand_name": "Foundation",
        "country": "Nicaragua",
        "table_structure": "order_form",
        "col_mapping": {
            0: "vitola",
            1: "size",
            2: "box_count",
            3: "wholesale_price",
        },
    },
    
    "Oliva Price Sheet - 2025.xlsx.pdf": {
        "type": "pdf",
        "brand_name": "Oliva",
        "country": "Nicaragua",
        "table_structure": "multi_column",
    },
    
    "AJ Fernandez.pdf": {
        "type": "pdf",
        "brand_name": "AJ Fernandez",
        "country": "Nicaragua",
        "table_structure": "encoded",  # Has encoding issues
        "needs_manual_review": True,
    },
}

# Vitola standardization
VITOLA_MAP = {
    # Standard sizes
    "robusto": "Robusto",
    "rob": "Robusto",
    "toro": "Toro",
    "churchill": "Churchill",
    "corona": "Corona",
    "petit corona": "Petit Corona",
    "lancero": "Lancero",
    "lonsdale": "Lonsdale",
    "gordo": "Gordo",
    "belicoso": "Belicoso",
    "torpedo": "Torpedo",
    "perfecto": "Perfecto",
    "figurado": "Figurado",
    "double corona": "Double Corona",
    "doble corona": "Double Corona",
    "gran toro": "Gran Toro",
    "petit robusto": "Petit Robusto",
    "rothschild": "Rothschild",
    "panatela": "Panatela",
    "corona gorda": "Corona Gorda",
    "double robusto": "Double Robusto",
    "super toro": "Super Toro",
    "sixty": "Sixty",
    "gigante": "Gigante",
}

# Wrapper standardization
WRAPPER_MAP = {
    "nat": "Natural",
    "natural": "Natural",
    "mad": "Maduro",
    "maduro": "Maduro",
    "oscuro": "Oscuro",
    "connecticut": "Connecticut",
    "conn": "Connecticut",
    "ct": "Connecticut",
    "habano": "Habano",
    "corojo": "Corojo",
    "sumatra": "Sumatra",
    "cameroon": "Cameroon",
    "broadleaf": "Broadleaf",
    "san andres": "San Andres",
    "rosado": "Rosado",
    "claro": "Claro",
    "candela": "Candela",
}

# Country codes
COUNTRY_MAP = {
    "nicaragua": "Nicaragua",
    "dominican republic": "Dominican Republic",
    "dr": "Dominican Republic",
    "honduras": "Honduras",
    "usa": "USA",
    "mexico": "Mexico",
    "brazil": "Brazil",
    "ecuador": "Ecuador",
    "peru": "Peru",
    "costa rica": "Costa Rica",
    "cuba": "Cuba",
}
