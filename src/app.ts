import {CategoryKey, Constants} from './constants';
import {EbayFeeCalculation} from './feeCalculator';

function numberInput(id: string, fallback = 0): number {
    const input = document.getElementById(id) as HTMLInputElement;
    const parsed = parseFloat(input.value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function checkboxInput(id: string): boolean {
    return (document.getElementById(id) as HTMLInputElement).checked;
}

function selectInput(id: string): string {
    return (document.getElementById(id) as HTMLSelectElement).value;
}

function currency(value: number): string {
    return `$${value.toFixed(2)}`;
}

function percent(value: number): string {
    return `${value.toFixed(2)}%`;
}

function share(value: number, total: number): number {
    return total > 0 ? (value / total) * 100 : 0;
}

function setText(id: string, value: string) {
    document.getElementById(id)!.innerText = value;
}

function updateCustomRatePlaceholder() {
    const category = selectInput('category') as CategoryKey;
    const customRateInput = document.getElementById('customRate') as HTMLInputElement;
    const storeSubscriber = checkboxInput('storeSubscriber');
    const categoryRate = Constants.CATEGORY_RATES[category];
    const rate = storeSubscriber ? categoryRate.storeRate : categoryRate.noStoreRate;

    customRateInput.placeholder = `${(rate * 100).toFixed(2)}%`;
}

function updatePaymentInputs() {
    const paymentProcessor = selectInput('paymentProcessor');
    const paymentRateInput = document.getElementById('paymentRate') as HTMLInputElement;
    const paymentFixedFeeInput = document.getElementById('paymentFixedFee') as HTMLInputElement;
    const customProcessor = paymentProcessor === 'custom';

    paymentRateInput.disabled = !customProcessor;
    paymentFixedFeeInput.disabled = !customProcessor;
    paymentRateInput.placeholder = customProcessor
        ? `${(Constants.DEFAULT_PAYMENT_PROCESSOR_RATE * 100).toFixed(2)}%`
        : 'Included';
    paymentFixedFeeInput.placeholder = customProcessor
        ? currency(Constants.DEFAULT_PAYMENT_PROCESSOR_FIXED_FEE)
        : 'Included';
}

function updateOutput() {
    const category = selectInput('category') as CategoryKey;
    const paymentProcessor = selectInput('paymentProcessor') as 'managed' | 'custom';
    const customFinalValueRate = numberInput('customRate') / 100;
    const paymentProcessorRate = paymentProcessor === 'custom'
        ? numberInput('paymentRate', Constants.DEFAULT_PAYMENT_PROCESSOR_RATE * 100) / 100
        : 0;
    const paymentProcessorFixedFee = paymentProcessor === 'custom'
        ? numberInput('paymentFixedFee', Constants.DEFAULT_PAYMENT_PROCESSOR_FIXED_FEE)
        : 0;

    const feeObj = new EbayFeeCalculation({
        category,
        storeSubscriber: checkboxInput('storeSubscriber'),
        customFinalValueRate,
        sellingPrice: numberInput('sellingPrice'),
        productCost: numberInput('productCost'),
        shippingCharged: numberInput('shippingCharged'),
        shippingCost: numberInput('shippingCost'),
        salesTaxRate: numberInput('salesTax'),
        promotionRate: numberInput('promotionRate'),
        topRatedPlus: checkboxInput('topRatedPlus'),
        internationalSale: checkboxInput('internationalSale'),
        paymentProcessor,
        paymentProcessorRate,
        paymentProcessorFixedFee,
    });

    const positiveProfit = Math.max(0, feeObj.netProfit);
    const chartTotal = positiveProfit + feeObj.totalCosts + feeObj.totalSellingFees;
    const profitDegrees = share(positiveProfit, chartTotal) * 3.6;
    const expensesDegrees = share(feeObj.totalCosts, chartTotal) * 3.6;
    const profitPercent = share(feeObj.netProfit, feeObj.grossRevenue);
    const feesPercent = share(feeObj.totalSellingFees, feeObj.grossRevenue);

    setText('summaryFees', currency(feeObj.totalSellingFees));
    setText('summaryFeesPercent', `(${percent(feesPercent)})`);
    setText('summaryProfit', currency(feeObj.netProfit));
    setText('summaryProfitPercent', `(${percent(profitPercent)})`);
    setText('summaryExpenses', currency(feeObj.totalCosts));
    setText('summarySellingFees', currency(feeObj.totalSellingFees));

    const chart = document.getElementById('profitChart') as HTMLElement;
    chart.style.background = chartTotal > 0
        ? `conic-gradient(var(--profit) 0deg ${profitDegrees}deg, var(--expenses) ${profitDegrees}deg ${profitDegrees + expensesDegrees}deg, var(--fees) ${profitDegrees + expensesDegrees}deg 360deg)`
        : 'conic-gradient(var(--profit) 0deg 360deg)';

    setText('buyerPaid', currency(feeObj.buyerPaid));

    setText('totalSaleAmount', currency(feeObj.buyerPaid));
    setText('totalSaleAmountDiff',
        `(${currency(feeObj.sellingPrice)} price + ${currency(feeObj.shippingCharged)} shipping + ${currency(feeObj.salesTaxAmount)} sales tax @ ${percent(feeObj.salesTaxRate)})`
    );

    setText('finalValueFee', currency(feeObj.finalValueFee));
    setText('finalValueFeeDiff', feeObj.topRatedPlusDiscount > 0
        ? `(-${currency(feeObj.finalValueFeeBeforeDiscount)} @ ${percent(feeObj.finalValueRate * 100)}; ${currency(feeObj.topRatedPlusDiscount)} Top Rated Plus discount)`
        : `(-${currency(feeObj.finalValueFee)} @ ${percent(feeObj.finalValueRate * 100)})`
    );

    setText('orderFee', currency(feeObj.orderFee));
    setText('orderFeeDiff',
        `(-${currency(feeObj.orderFee)} per-order fee)`
    );

    setText('promotionFee', currency(feeObj.promotionFee));
    setText('promotionFeeDiff',
        `(-${currency(feeObj.promotionFee)} promoted listing fee @ ${percent(feeObj.promotionRate)})`
    );

    setText('internationalFee', currency(feeObj.internationalFee));
    setText('internationalFeeDiff', feeObj.internationalSale
        ? `(-${currency(feeObj.internationalFee)} international fee @ ${percent(Constants.INTERNATIONAL_FEE_RATE * 100)})`
        : `(-${currency(0)} international fee)`
    );

    setText('paymentFee', currency(feeObj.paymentProcessorFee));
    setText('paymentFeeDiff', feeObj.paymentProcessor === 'custom'
        ? `(-${currency(feeObj.paymentProcessorFee)} processor fee @ ${percent(feeObj.paymentProcessorRate * 100)} + ${currency(feeObj.paymentProcessorFixedFee)})`
        : '($0.00; included in eBay managed payments)'
    );

    setText('totalFees', currency(feeObj.totalFeesAndCosts));
    setText('totalFeesDiff',
        `(${currency(feeObj.totalSellingFees)} fees + ${currency(feeObj.totalCosts)} product/shipping costs)`
    );

    setText('netProfit', currency(feeObj.netProfit));
    setText('netProfitDiff',
        `(${currency(feeObj.grossRevenue)} revenue - ${currency(feeObj.totalFeesAndCosts)} fees/costs)`
    );

    setText('profitMargin', percent(feeObj.profitMargin));
    setText('profitMarginDiff', feeObj.grossRevenue > 0
        ? `(net profit / ${currency(feeObj.grossRevenue)} revenue)`
        : ''
    );
}

function updateAll() {
    updateCustomRatePlaceholder();
    updatePaymentInputs();
    updateOutput();
}

[
    'category',
    'storeSubscriber',
    'customRate',
    'sellingPrice',
    'productCost',
    'shippingCharged',
    'shippingCost',
    'salesTax',
    'promotionRate',
    'topRatedPlus',
    'internationalSale',
    'paymentProcessor',
    'paymentRate',
    'paymentFixedFee',
].forEach((id) => {
    const element = document.getElementById(id) as HTMLInputElement | HTMLSelectElement;
    element.addEventListener(element instanceof HTMLSelectElement || element.type === 'checkbox' ? 'change' : 'input', updateAll);
});

updateAll();
