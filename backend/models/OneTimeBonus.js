const mongoose = require("mongoose");

const oneTimeBonusSchema = new mongoose.Schema(
  {
    referrerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    investorEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    investmentAmount: {
      type: Number,
      required: true,
    },
    category: {
      type: String, // "beginner" or "pro"
      required: true,
    },
    monthlyBonusAmount: {
      type: Number,
      required: true,
    },
    totalMonths: {
      type: Number,
      default: 1, // ১, ২ বা ৩ মাস
    },
    monthsPaid: {
      type: Number,
      default: 0, // ইতোমধ্যে কত মাস দেওয়া হয়েছে
    },
    nextPayoutDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Active", "Completed"],
      default: "Active",
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.OneTimeBonus ||
  mongoose.model("OneTimeBonus", oneTimeBonusSchema);
