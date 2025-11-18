(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.PharmaValidation = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    function validateSaleRequest(drugs = [], items = []) {
        const issues = [];
        const inventoryMap = new Map(drugs.map(drug => [String(drug.id), Number(drug.quantity) || 0]));

        for (const item of items) {
            const requestedQty = Number(item.qty || item.quantity || 0);
            const id = item.drugId != null ? String(item.drugId) : undefined;

            if (!id || requestedQty <= 0) {
                issues.push(`Invalid entry for ${item.drugName || 'Unknown item'}`);
                continue;
            }

            const currentStock = inventoryMap.has(id) ? inventoryMap.get(id) : null;
            if (currentStock === null) {
                issues.push(`Drug not found: ${item.drugName || id}`);
            } else if (requestedQty > currentStock) {
                issues.push(`Insufficient stock for ${item.drugName || id} (have ${currentStock}, need ${requestedQty})`);
            }
        }

        return {
            ok: issues.length === 0,
            issues
        };
    }

    function estimateBase64Size(dataUrl = '') {
        if (!dataUrl.includes(',')) return 0;
        const base64 = dataUrl.split(',')[1];
        return Math.ceil((base64.length * 3) / 4);
    }

    return {
        validateSaleRequest,
        estimateBase64Size
    };
}));

