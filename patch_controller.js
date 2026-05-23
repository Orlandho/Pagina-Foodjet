const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend/src/controllers/orderController.js');
let code = fs.readFileSync(filePath, 'utf8');

// Replace orderItems with OrderItem in createOrder
code = code.replace(
    /orderItems:\s*\{\s*create:\s*orderItemsData\s*\}/,
    'OrderItem: { create: orderItemsData }'
);
code = code.replace(
    /include:\s*\{\s*orderItems:\s*true\s*\}/,
    'include: { OrderItem: true }'
);

// Replace relations in getMyOrders
code = code.replace(
    /restaurante:\s*\{\s*select:/,
    'Restaurant: { select:'
);
code = code.replace(
    /orderItems:\s*\{/,
    'OrderItem: {'
);
code = code.replace(
    /product:\s*true/,
    'Product: true'
);

fs.writeFileSync(filePath, code);
console.log('Patch applied successfully.');
