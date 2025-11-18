(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.PharmaCalculations = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    function toNumber(value) {
        const num = Number(value);
        return Number.isFinite(num) ? num : 0;
    }

    function calculateSaleSummary({ items = [], taxRate = 0, discountRate = 0, cashReceived = 0 }) {
        const normalizedTaxRate = Math.max(0, taxRate) / 100;
        const normalizedDiscountRate = Math.min(Math.max(0, discountRate), 100) / 100;

        const subtotal = items.reduce((sum, item) => sum + toNumber(item.total || item.lineTotal), 0);
        const totalUnits = items.reduce((sum, item) => sum + toNumber(item.quantity || item.qty), 0);

        const taxAmount = +(subtotal * normalizedTaxRate).toFixed(2);
        const discountAmount = +(subtotal * normalizedDiscountRate).toFixed(2);
        const grandTotal = +(subtotal + taxAmount - discountAmount).toFixed(2);
        const changeDue = +(toNumber(cashReceived) - grandTotal).toFixed(2);

        return {
            subtotal: +subtotal.toFixed(2),
            taxAmount,
            discountAmount,
            grandTotal,
            changeDue,
            totalUnits
        };
    }

    return {
        calculateSaleSummary
    };
}));

