const mongoose = require('mongoose');

const PaypalOrderSchema = new mongoose.Schema({
  orderid: { type: String, required: true },
  orderstatus: { type: String, required: true, default: 'APPROVED' },
  createddate: { type: Date, default: () => Date.now() },
  modifieddate: { type: Date, default: () => Date.now() },
  userid: { type: String, required: true },
  purchase_item_type: { type: String, required: true },
  purchase_item_id: { type: String, required: true },
}, {
  timestamps: true
});

const PaypalOrder = mongoose.model('PaypalOrder', PaypalOrderSchema);

module.exports = PaypalOrder;