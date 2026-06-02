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

function updateCustomRatePlaceholder() {
    const category = selectInput('category') as CategoryKey;
    const customRateInput = document.getElementById('customRate') as HTMLInputElement;
    const storeSubscriber = checkboxInput('storeSubscriber');
    const categoryRate = Constants.CATEGORY_RATES[category];
    const rate = storeSubscriber ? categoryRate.storeRate : categoryRate.noStoreRate;

    customRateInput.placeholder = `Default: ${(rate * 100).toFixed(2)}%`;
}

function updatePaymentInputs() {
    const paymentProcessor = selectInput('paymentProcessor');
    const paymentRateInput = document.getElementById('paymentRate') as HTMLInputElement;
    const paymentFixedFeeInput = document.getElementById('paymentFixedFee') as HTMLInputElement;
    const customProcessor = paymentProcessor === 'custom';

    paymentRateInput.disabled = !customProcessor;
    paymentFixedFeeInput.disabled = !customProcessor;
    paymentRateInput.placeholder = customProcessor
        ? `Default: ${(Constants.DEFAULT_PAYMENT_PROCESSOR_RATE * 100).toFixed(2)}%`
        : 'Included in eBay fee';
    paymentFixedFeeInput.placeholder = customProcessor
        ? `Default: ${currency(Constants.DEFAULT_PAYMENT_PROCESSOR_FIXED_FEE)}`
        : 'Included in eBay fee';
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

    document.getElementById('buyerPaid')!.innerText = currency(feeObj.buyerPaid);

    document.getElementById('totalSaleAmount')!.innerText = currency(feeObj.buyerPaid);
    document.getElementById('totalSaleAmountDiff')!.innerText =
        `(${currency(feeObj.sellingPrice)} price + ${currency(feeObj.shippingCharged)} shipping + ${currency(feeObj.salesTaxAmount)} sales tax @ ${percent(feeObj.salesTaxRate)})`;

    document.getElementById('finalValueFee')!.innerText = currency(feeObj.finalValueFee);
    document.getElementById('finalValueFeeDiff')!.innerText = feeObj.topRatedPlusDiscount > 0
        ? `(-${currency(feeObj.finalValueFeeBeforeDiscount)} @ ${percent(feeObj.finalValueRate * 100)}; ${currency(feeObj.topRatedPlusDiscount)} Top Rated Plus discount)`
        : `(-${currency(feeObj.finalValueFee)} @ ${percent(feeObj.finalValueRate * 100)})`;

    document.getElementById('orderFee')!.innerText = currency(feeObj.orderFee);
    document.getElementById('orderFeeDiff')!.innerText =
        `(-${currency(feeObj.orderFee)} per-order fee)`;

    document.getElementById('promotionFee')!.innerText = currency(feeObj.promotionFee);
    document.getElementById('promotionFeeDiff')!.innerText =
        `(-${currency(feeObj.promotionFee)} promoted listing fee @ ${percent(feeObj.promotionRate)})`;

    document.getElementById('internationalFee')!.innerText = currency(feeObj.internationalFee);
    document.getElementById('internationalFeeDiff')!.innerText = feeObj.internationalSale
        ? `(-${currency(feeObj.internationalFee)} international fee @ ${percent(Constants.INTERNATIONAL_FEE_RATE * 100)})`
        : `(-${currency(0)} international fee)`;

    document.getElementById('paymentFee')!.innerText = currency(feeObj.paymentProcessorFee);
    document.getElementById('paymentFeeDiff')!.innerText = feeObj.paymentProcessor === 'custom'
        ? `(-${currency(feeObj.paymentProcessorFee)} processor fee @ ${percent(feeObj.paymentProcessorRate * 100)} + ${currency(feeObj.paymentProcessorFixedFee)})`
        : '($0.00; included in eBay managed payments)';

    document.getElementById('totalFees')!.innerText = currency(feeObj.totalFeesAndCosts);
    document.getElementById('totalFeesDiff')!.innerText =
        `(${currency(feeObj.totalSellingFees)} fees + ${currency(feeObj.totalCosts)} product/shipping costs)`;

    document.getElementById('netProfit')!.innerText = currency(feeObj.netProfit);
    document.getElementById('netProfitDiff')!.innerText =
        `(${currency(feeObj.grossRevenue)} revenue - ${currency(feeObj.totalFeesAndCosts)} fees/costs)`;

    document.getElementById('profitMargin')!.innerText = percent(feeObj.profitMargin);
    document.getElementById('profitMarginDiff')!.innerText = feeObj.grossRevenue > 0
        ? `(net profit / ${currency(feeObj.grossRevenue)} revenue)`
        : '';
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
