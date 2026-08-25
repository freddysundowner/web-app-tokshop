const mongoose = require("mongoose");
const BankSchema = mongoose.Schema({
  accountname: {
    type: String,
    required: true,
  },
  accountno: {
    type: String,
    required: true,
  },
  userid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  primary: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("bank", BankSchema);
