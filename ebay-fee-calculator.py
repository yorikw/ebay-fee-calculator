import argparse
from dataclasses import dataclass


@dataclass(frozen=True)
class CategoryFeeRate:
    label: str
    no_store_rate: float
    store_rate: float


class Constants:
    CATEGORY_RATES = {
        "most": CategoryFeeRate("Most categories", 0.136, 0.127),
        "media": CategoryFeeRate("Books, movies, music", 0.153, 0.144),
        "electronics": CategoryFeeRate("Consumer electronics", 0.09, 0.087),
        "musical": CategoryFeeRate("Musical instruments & gear", 0.0635, 0.0595),
        "motors": CategoryFeeRate("eBay Motors parts & accessories", 0.136, 0.1235),
        "custom": CategoryFeeRate("Custom rate", 0.136, 0.127),
    }

    LOW_ORDER_FEE_LIMIT = 10.0
    LOW_ORDER_FEE = 0.30
    HIGH_ORDER_FEE = 0.40
    TOP_RATED_PLUS_DISCOUNT_RATE = 0.10
    INTERNATIONAL_FEE_RATE = 0.0165
    DEFAULT_PAYMENT_PROCESSOR_RATE = 0.0349
    DEFAULT_PAYMENT_PROCESSOR_FIXED_FEE = 0.49


class EbayFeeCalculation:
    def __init__(
        self,
        category: str = "most",
        store_subscriber: bool = False,
        custom_final_value_rate: float | None = None,
        selling_price: float = 0.0,
        product_cost: float = 0.0,
        shipping_charged: float = 0.0,
        shipping_cost: float = 0.0,
        sales_tax_rate: float = 0.0,
        promotion_rate: float = 0.0,
        top_rated_plus: bool = False,
        international_sale: bool = False,
        payment_processor: str = "managed",
        payment_processor_rate: float = Constants.DEFAULT_PAYMENT_PROCESSOR_RATE,
        payment_processor_fixed_fee: float = Constants.DEFAULT_PAYMENT_PROCESSOR_FIXED_FEE,
    ):
        category_rate = Constants.CATEGORY_RATES[category]
        self.category = category
        self.category_label = category_rate.label
        self.final_value_rate = (
            custom_final_value_rate
            if custom_final_value_rate is not None and custom_final_value_rate > 0
            else category_rate.store_rate if store_subscriber else category_rate.no_store_rate
        )
        self.store_subscriber = store_subscriber
        self.selling_price = selling_price
        self.product_cost = product_cost
        self.shipping_charged = shipping_charged
        self.shipping_cost = shipping_cost
        self.sales_tax_rate = sales_tax_rate
        self.promotion_rate = promotion_rate
        self.top_rated_plus = top_rated_plus
        self.international_sale = international_sale
        self.payment_processor = payment_processor
        self.payment_processor_rate = payment_processor_rate
        self.payment_processor_fixed_fee = payment_processor_fixed_fee

        self.gross_revenue = self.selling_price + self.shipping_charged
        self.sales_tax_amount = self.gross_revenue * (self.sales_tax_rate / 100)
        self.buyer_paid = self.gross_revenue + self.sales_tax_amount

        self.final_value_fee_before_discount = self.buyer_paid * self.final_value_rate
        self.top_rated_plus_discount = (
            self.final_value_fee_before_discount * Constants.TOP_RATED_PLUS_DISCOUNT_RATE
            if self.top_rated_plus
            else 0.0
        )
        self.final_value_fee = max(
            0.0,
            self.final_value_fee_before_discount - self.top_rated_plus_discount,
        )
        self.order_fee = (
            Constants.LOW_ORDER_FEE
            if self.buyer_paid > 0 and self.gross_revenue <= Constants.LOW_ORDER_FEE_LIMIT
            else Constants.HIGH_ORDER_FEE if self.buyer_paid > 0 else 0.0
        )
        self.promotion_fee = self.gross_revenue * (self.promotion_rate / 100)
        self.international_fee = (
            self.buyer_paid * Constants.INTERNATIONAL_FEE_RATE
            if self.international_sale
            else 0.0
        )
        self.payment_processor_fee = (
            self.buyer_paid * self.payment_processor_rate + self.payment_processor_fixed_fee
            if self.payment_processor == "custom" and self.buyer_paid > 0
            else 0.0
        )

        self.total_selling_fees = (
            self.final_value_fee
            + self.order_fee
            + self.promotion_fee
            + self.international_fee
            + self.payment_processor_fee
        )
        self.total_costs = self.product_cost + self.shipping_cost
        self.total_fees_and_costs = self.total_selling_fees + self.total_costs
        self.net_profit = self.gross_revenue - self.total_fees_and_costs
        self.profit_margin = (
            self.net_profit / self.gross_revenue * 100
            if self.gross_revenue > 0
            else 0.0
        )


def formatted_output(calc: EbayFeeCalculation) -> str:
    lines = [
        ("Buyer pays:", f"${calc.buyer_paid:.2f}"),
        (
            "Total sale amount:",
            f"${calc.buyer_paid:.2f} (${calc.selling_price:.2f} price + ${calc.shipping_charged:.2f} shipping + ${calc.sales_tax_amount:.2f} sales tax @ {calc.sales_tax_rate:.2f}%)",
        ),
        (
            "Final value fee:",
            f"${calc.final_value_fee:.2f} (-${calc.final_value_fee:.2f} @ {calc.final_value_rate * 100:.2f}%)",
        ),
        ("Per-order fee:", f"${calc.order_fee:.2f} (-${calc.order_fee:.2f} per-order fee)"),
        (
            "Promotion fee:",
            f"${calc.promotion_fee:.2f} (-${calc.promotion_fee:.2f} promoted listing fee @ {calc.promotion_rate:.2f}%)",
        ),
        (
            "International fee:",
            f"${calc.international_fee:.2f} (-${calc.international_fee:.2f} international fee)",
        ),
        (
            "Payment processor fee:",
            f"${calc.payment_processor_fee:.2f}",
        ),
        (
            "Total fees and costs:",
            f"${calc.total_fees_and_costs:.2f} (${calc.total_selling_fees:.2f} fees + ${calc.total_costs:.2f} product/shipping costs)",
        ),
        ("Net profit:", f"${calc.net_profit:.2f}"),
        ("Profit margin:", f"{calc.profit_margin:.2f}%"),
    ]

    max_len = max(len(line[0]) for line in lines)
    return "\n".join(f"{line[0].ljust(max_len)} {line[1]}" for line in lines)


def test_fee_calculator() -> None:
    test_cases = [
        {
            "input": {
                "selling_price": 100,
                "product_cost": 40,
                "shipping_charged": 5,
                "shipping_cost": 8,
                "sales_tax_rate": 7,
            },
            "expected": """\
Buyer pays:            $112.35
Total sale amount:     $112.35 ($100.00 price + $5.00 shipping + $7.35 sales tax @ 7.00%)
Final value fee:       $15.28 (-$15.28 @ 13.60%)
Per-order fee:         $0.40 (-$0.40 per-order fee)
Promotion fee:         $0.00 (-$0.00 promoted listing fee @ 0.00%)
International fee:     $0.00 (-$0.00 international fee)
Payment processor fee: $0.00
Total fees and costs:  $63.68 ($15.68 fees + $48.00 product/shipping costs)
Net profit:            $41.32
Profit margin:         39.35%""",
        },
        {
            "input": {},
            "expected": """\
Buyer pays:            $0.00
Total sale amount:     $0.00 ($0.00 price + $0.00 shipping + $0.00 sales tax @ 0.00%)
Final value fee:       $0.00 (-$0.00 @ 13.60%)
Per-order fee:         $0.00 (-$0.00 per-order fee)
Promotion fee:         $0.00 (-$0.00 promoted listing fee @ 0.00%)
International fee:     $0.00 (-$0.00 international fee)
Payment processor fee: $0.00
Total fees and costs:  $0.00 ($0.00 fees + $0.00 product/shipping costs)
Net profit:            $0.00
Profit margin:         0.00%""",
        },
    ]

    for test in test_cases:
        calc = EbayFeeCalculation(**test["input"])
        result = formatted_output(calc)
        assert result == test["expected"], (
            f"Expected:\n{test['expected']}\nGot:\n{result}"
        )


def main() -> None:
    parser = argparse.ArgumentParser(description="eBay Fee Calculator")
    parser.add_argument("-c", "--category", default="most", choices=Constants.CATEGORY_RATES.keys())
    parser.add_argument("--store", action="store_true", help="Use eBay Store subscriber rates")
    parser.add_argument("--custom-rate", type=float, default=None, help="Custom final value fee rate as a percentage")
    parser.add_argument("-p", "--price", type=float, default=0.0, help="Selling price")
    parser.add_argument("--product-cost", type=float, default=0.0, help="Product cost")
    parser.add_argument("--shipping-charged", type=float, default=0.0, help="Shipping charged to buyer")
    parser.add_argument("--shipping-cost", type=float, default=0.0, help="Shipping cost paid by seller")
    parser.add_argument("-t", "--tax", type=float, default=0.0, help="Sales tax percentage")
    parser.add_argument("--promotion", type=float, default=0.0, help="Promoted listing percentage")
    parser.add_argument("--top-rated-plus", action="store_true", help="Apply Top Rated Plus final value fee discount")
    parser.add_argument("--international", action="store_true", help="Apply international fee")
    parser.add_argument("--custom-payment", action="store_true", help="Apply a custom payment processor fee")
    parser.add_argument("--payment-rate", type=float, default=Constants.DEFAULT_PAYMENT_PROCESSOR_RATE * 100)
    parser.add_argument("--payment-fixed-fee", type=float, default=Constants.DEFAULT_PAYMENT_PROCESSOR_FIXED_FEE)
    args = parser.parse_args()

    calc = EbayFeeCalculation(
        category=args.category,
        store_subscriber=args.store,
        custom_final_value_rate=args.custom_rate / 100 if args.custom_rate else None,
        selling_price=args.price,
        product_cost=args.product_cost,
        shipping_charged=args.shipping_charged,
        shipping_cost=args.shipping_cost,
        sales_tax_rate=args.tax,
        promotion_rate=args.promotion,
        top_rated_plus=args.top_rated_plus,
        international_sale=args.international,
        payment_processor="custom" if args.custom_payment else "managed",
        payment_processor_rate=args.payment_rate / 100,
        payment_processor_fixed_fee=args.payment_fixed_fee,
    )
    print(formatted_output(calc))


if __name__ == "__main__":
    test_fee_calculator()
    main()
