BULK_DISCOUNT = 0.15   # 15% off retail — reflects volume purchase agreements
MARKUP = 0.03          # 3% margin charged to customers


def get_bulk_cost(retail_cost: float) -> float:
    return retail_cost * (1 - BULK_DISCOUNT)


def get_customer_charge(bulk_cost: float) -> float:
    return bulk_cost * (1 + MARKUP)


def calculate_job_pricing(retail_cost: float) -> dict:
    bulk_cost = get_bulk_cost(retail_cost)
    customer_charge = get_customer_charge(bulk_cost)
    savings = retail_cost - customer_charge
    savings_pct = (savings / retail_cost * 100) if retail_cost > 0 else 0
    return {
        "retail_cost_usd": round(retail_cost, 8),
        "bulk_cost_usd": round(bulk_cost, 8),
        "customer_charge_usd": round(customer_charge, 8),
        "savings_usd": round(savings, 8),
        "savings_pct": round(savings_pct, 2),
    }
