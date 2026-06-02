import {CategoryKey, Constants} from './constants';

export interface EbayFeeInputs {
    readonly category: CategoryKey;
    readonly storeSubscriber: boolean;
    readonly customFinalValueRate?: number;
    readonly sellingPrice: number;
    readonly productCost: number;
    readonly shippingCharged: number;
    readonly shippingCost: number;
    readonly salesTaxRate: number;
    readonly promotionRate: number;
    readonly topRatedPlus: boolean;
    readonly internationalSale: boolean;
    readonly paymentProcessor: 'managed' | 'custom';
    readonly paymentProcessorRate: number;
    readonly paymentProcessorFixedFee: number;
}

export class EbayFeeCalculation {
    category: CategoryKey;
    categoryLabel: string;
    finalValueRate: number;
    storeSubscriber: boolean;
    sellingPrice: number;
    productCost: number;
    shippingCharged: number;
    shippingCost: number;
    salesTaxRate: number;
    promotionRate: number;
    topRatedPlus: boolean;
    internationalSale: boolean;
    paymentProcessor: 'managed' | 'custom';
    paymentProcessorRate: number;
    paymentProcessorFixedFee: number;

    grossRevenue: number;
    salesTaxAmount: number;
    buyerPaid: number;
    finalValueFeeBeforeDiscount: number;
    topRatedPlusDiscount: number;
    finalValueFee: number;
    orderFee: number;
    promotionFee: number;
    internationalFee: number;
    paymentProcessorFee: number;
    totalSellingFees: number;
    totalCosts: number;
    totalFeesAndCosts: number;
    netProfit: number;
    profitMargin: number;

    constructor(inputs: EbayFeeInputs) {
        const categoryRate = Constants.CATEGORY_RATES[inputs.category];
        this.category = inputs.category;
        this.categoryLabel = categoryRate.label;
        this.finalValueRate = inputs.customFinalValueRate && inputs.customFinalValueRate > 0
            ? inputs.customFinalValueRate
            : (inputs.storeSubscriber ? categoryRate.storeRate : categoryRate.noStoreRate);
        this.storeSubscriber = inputs.storeSubscriber;
        this.sellingPrice = inputs.sellingPrice;
        this.productCost = inputs.productCost;
        this.shippingCharged = inputs.shippingCharged;
        this.shippingCost = inputs.shippingCost;
        this.salesTaxRate = inputs.salesTaxRate;
        this.promotionRate = inputs.promotionRate;
        this.topRatedPlus = inputs.topRatedPlus;
        this.internationalSale = inputs.internationalSale;
        this.paymentProcessor = inputs.paymentProcessor;
        this.paymentProcessorRate = inputs.paymentProcessorRate;
        this.paymentProcessorFixedFee = inputs.paymentProcessorFixedFee;

        this.grossRevenue = this.sellingPrice + this.shippingCharged;
        this.salesTaxAmount = this.grossRevenue * (this.salesTaxRate / 100);
        this.buyerPaid = this.grossRevenue + this.salesTaxAmount;

        this.finalValueFeeBeforeDiscount = this.buyerPaid * this.finalValueRate;
        this.topRatedPlusDiscount = this.topRatedPlus
            ? this.finalValueFeeBeforeDiscount * Constants.TOP_RATED_PLUS_DISCOUNT_RATE
            : 0;
        this.finalValueFee = Math.max(0, this.finalValueFeeBeforeDiscount - this.topRatedPlusDiscount);
        this.orderFee = this.buyerPaid > 0
            ? (this.grossRevenue <= Constants.LOW_ORDER_FEE_LIMIT ? Constants.LOW_ORDER_FEE : Constants.HIGH_ORDER_FEE)
            : 0;
        this.promotionFee = this.grossRevenue * (this.promotionRate / 100);
        this.internationalFee = this.internationalSale
            ? this.buyerPaid * Constants.INTERNATIONAL_FEE_RATE
            : 0;
        this.paymentProcessorFee = this.paymentProcessor === 'custom' && this.buyerPaid > 0
            ? this.buyerPaid * this.paymentProcessorRate + this.paymentProcessorFixedFee
            : 0;

        this.totalSellingFees = this.finalValueFee + this.orderFee + this.promotionFee + this.internationalFee + this.paymentProcessorFee;
        this.totalCosts = this.productCost + this.shippingCost;
        this.totalFeesAndCosts = this.totalSellingFees + this.totalCosts;
        this.netProfit = this.grossRevenue - this.totalFeesAndCosts;
        this.profitMargin = this.grossRevenue > 0 ? (this.netProfit / this.grossRevenue) * 100 : 0;
    }
}
