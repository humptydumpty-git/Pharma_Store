const assert = require('assert');
const path = require('path');
const calculations = require(path.resolve(__dirname, '../src/utils/calculations.js'));
const validation = require(path.resolve(__dirname, '../src/utils/validation.js'));

const { calculateSaleSummary } = calculations;
const { validateSaleRequest, estimateBase64Size } = validation;

function testCalculateSaleSummaryBasic() {
    const summary = calculateSaleSummary({
        items: [
            { total: 20, quantity: 2 },
            { total: 30, quantity: 3 }
        ],
        taxRate: 7.5,
        discountRate: 10,
        cashReceived: 60
    });

    assert.strictEqual(summary.subtotal, 50);
    assert.strictEqual(summary.taxAmount, 3.75);
    assert.strictEqual(summary.discountAmount, 5);
    assert.strictEqual(summary.grandTotal, 48.75);
    assert.strictEqual(summary.changeDue, 11.25);
    assert.strictEqual(summary.totalUnits, 5);
}

function testCalculateSaleSummaryEdgeCases() {
    const summary = calculateSaleSummary({
        items: [{ total: 'abc', quantity: 'xyz' }],
        taxRate: -5,
        discountRate: 120,
        cashReceived: 0
    });

    assert.strictEqual(summary.subtotal, 0);
    assert.strictEqual(summary.taxAmount, 0);
    assert.strictEqual(summary.discountAmount, 0);
    assert.strictEqual(summary.grandTotal, 0);
    assert.strictEqual(summary.changeDue, 0);
    assert.strictEqual(summary.totalUnits, 0);
}

function testValidateSaleRequest() {
    const drugs = [{ id: '1', quantity: 5, name: 'Drug A' }];
    const result = validateSaleRequest(drugs, [
        { drugId: '1', qty: 3, drugName: 'Drug A' },
        { drugId: '2', qty: 1, drugName: 'Missing Drug' }
    ]);
    assert.strictEqual(result.ok, false);
    assert.ok(result.issues[0].includes('Drug not found'));
}

function testEstimateBase64Size() {
    const dataUrl = 'data:image/png;base64,' + Buffer.from('hello world').toString('base64');
    const size = estimateBase64Size(dataUrl);
    assert.ok(size > 0);
}

function run() {
    const tests = [
        testCalculateSaleSummaryBasic,
        testCalculateSaleSummaryEdgeCases,
        testValidateSaleRequest,
        testEstimateBase64Size
    ];

    tests.forEach(test => {
        test();
        console.log(`✔ ${test.name} passed`);
    });

    console.log('All PharmaStore tests passed');
}

run();

