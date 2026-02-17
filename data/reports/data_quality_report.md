# BoxBlueBook Data Quality Report
Generated: 2026-02-05

## Summary

| Metric | Count |
|--------|-------|
| **Total Unique Cigars** | 2,165 |
| **Total Brands** | 90 |
| **Total Product Lines** | 874 |
| **Source Files Processed** | 35 |
| **Raw Records (pre-dedup)** | 2,447 |
| **Duplicates Removed** | 282 |

---

## Data Coverage

| Field | Records | Coverage |
|-------|---------|----------|
| Wholesale Price | 2,043 | 94.4% |
| MSRP (single or box) | 1,753 | 81.0% |
| Size (length & ring) | 1,741 | 80.4% |
| Country of Origin | 1,573 | 72.7% |
| Vitola | 992 | 45.8% |
| Wrapper Type | 733 | 33.9% |

---

## Successfully Parsed Files (27)

### Excel Files (5)
| File | Cigars | Status |
|------|--------|--------|
| AUSA Price List 2025.xlsx | 414 | ✅ Complete |
| J.C. Newman Price List and UPC - 2025.xlsx | 314 | ✅ Complete |
| Arturo Fuente Price List w Special Cigars and UPCs - 2025.xlsx | 240 | ✅ Complete |
| Drew Estate Retailer Price List.xlsx | 202 | ✅ Complete |
| Drew Diplomat Exclusive Products Price List.xlsx | 58 | ✅ Complete |

### PDF Files (22)
| File | Cigars | Status |
|------|--------|--------|
| Oliva Price Sheet - 2025.xlsx.pdf | 191 | ✅ Complete |
| Ashton Cigar Wholesale Price List 2025 July.pdf | 155 | ✅ Complete |
| La Flor Dominicana Price List - 2025.pdf | 131 | ✅ Complete |
| DTT_2025 Order Forms & MAP - 060325.pdf | 119 | ✅ Complete |
| Oscar Valladares Price List - 2025.pdf | 88 | ✅ Complete |
| My Father Price List 2025.pdf | 86 | ✅ Complete |
| ESPINOSA PRICESHEET JUNE 2025.pdf | 79 | ✅ Complete |
| GCC Standard Pricelist - 2025.pdf | 73 | ✅ Complete |
| Forged Cigar Co Standard Pricelist_AUG 2025.pdf | 64 | ✅ Complete |
| Foundation Cigar Company Order Form 2025.pdf | 46 | ✅ Complete |
| Plasencia Order Form V34.pdf | 40 | ✅ Complete |
| ADVentura Cigars Pricelist OrderForm USA2024.pdf | 29 | ✅ Complete |
| Patina Price Sheet.pdf | 25 | ✅ Complete |
| BlackBird CORE LINE Price List January 2025.pdf | 24 | ✅ Complete |
| Padron Price List - 2025.pdf | 22 | ✅ Complete |
| Perdomo Cigars Price List - MAY 2025.pdf | 19 | ✅ Complete |
| BlackBird Value Cigars Price List Sept 2024.pdf | 18 | ✅ Complete |
| El Septimo Cigar Wholesale USA - 2025.pdf | 8 | ✅ Complete |

---

## Files Needing Manual Review (8)

These files have complex layouts, encoding issues, or non-standard formats:

| File | Issue | Recommendation |
|------|-------|----------------|
| **Davidoff Price List.pdf** | Complex multi-page layout with images | Manual data entry or OCR |
| **Rocky Patel Pricing Packet - 2025.pdf** | Multi-packet format, tabs | Custom parser needed |
| **La Aurora 2025 Price List.pdf** | Image-based PDF | OCR required |
| **AJ Fernandez.pdf** | Font encoding issues (CID fonts) | Re-export from source |
| **Miami Cigar Price List - MAR 2025.pdf** | Complex layout | Manual review |
| **Rojas Products 2025.pdf** | Non-tabular format | Manual data entry |
| **Dapper Price Sheet.pdf** | Non-standard table structure | Custom parser |
| **TOSCANO PRICE LIST - 2025.pdf** | Italian machine-made cigars (may not be needed) | Optional |

### Low-Priority / Specialty Files
| File | Issue | Notes |
|------|-------|-------|
| Avanti Price list PCA 2025.pdf | Machine-made cigars | Low priority |
| God of Fire, Angelenos, and Sencillo.pdf | Premium/limited editions | May need special handling |
| Fuente Aged Selection.pdf | Special aging program | Different data model |
| Firebird Order Form - 2024.pdf | Partial extraction (2 records) | May need cleanup |

---

## Top 20 Brands by Cigar Count

| Rank | Brand | Cigars |
|------|-------|--------|
| 1 | J.C. Newman | 312 |
| 2 | Arturo Fuente | 248 |
| 3 | Oliva | 161 |
| 4 | La Flor Dominicana | 131 |
| 5 | Ashton | 126 |
| 6 | Romeo y Julieta | 92 |
| 7 | My Father | 83 |
| 8 | Diesel | 78 |
| 9 | Montecristo | 76 |
| 10 | Joya De Nicaragua | 72 |
| 11 | Oscar Valladares | 71 |
| 12 | Espinosa | 70 |
| 13 | Punch | 56 |
| 14 | Acid | 55 |
| 15 | General Cigar | 51 |
| 16 | Liga Privada | 47 |
| 17 | Foundation | 46 |
| 18 | Undercrown | 44 |
| 19 | Plasencia | 40 |
| 20 | H. Upmann | 39 |

---

## Data Files Generated

```
~/Projects/boxbluebook/data/
├── master-cigars.json      # 2,165 cigars with all fields
├── brands.json             # 90 brands with metadata
├── lines.json              # 874 product lines
├── extracted/
│   ├── excel/              # Per-manufacturer JSON (5 files)
│   └── pdf/                # Per-manufacturer JSON (30 files)
├── reports/
│   ├── excel_extraction_report.json
│   ├── pdf_extraction_report.json
│   └── aggregation_report.json
└── scripts/
    ├── config.py           # Extraction configuration
    ├── extract_excel.py    # Excel parser
    ├── extract_pdf.py      # PDF parser
    ├── aggregate.py        # Data aggregation
    └── import_supabase.py  # Supabase importer
```

---

## Next Steps

1. **Manual Review** - Extract data from 8 files needing manual attention (~200-300 additional cigars estimated)
2. **Data Enrichment** - Add missing vitola/wrapper info using cigar databases or AI classification
3. **Price Validation** - Cross-check MSRP values against retail sites
4. **Supabase Import** - Run `import_supabase.py` once schema is ready
5. **Image Collection** - Source product images for each cigar

---

## Schema Reference

Each cigar record contains:

```json
{
  "id": "abc123def456",
  "slug": "arturo-fuente-don-carlos-robusto",
  "brand": "Arturo Fuente",
  "line": "Don Carlos",
  "name": "AF Don Carlos Robusto 25",
  "vitola": "Robusto",
  "size": "5 x 50",
  "length": 5.0,
  "ring_gauge": 50,
  "box_count": 25,
  "wholesale_price": 225.50,
  "msrp_single": 15.00,
  "msrp_box": 375.00,
  "wrapper": "Natural",
  "country": "Dominican Republic",
  "upc": "843182100001",
  "sku": "914500",
  "source": "Arturo Fuente Price List 2025"
}
```
