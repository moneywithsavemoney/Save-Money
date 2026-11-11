const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

  // 🔹 BASIC INFO
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  mobile: {
    type: String,
    required: true
  },

  password: {
    type: String,
    required: true
  },

  walletAddress: {
    type: String,
    default: ""
  },

  termsAccepted: {
    type: Boolean,
    default: false
  },
  
  role: {
    type: String,
    default: "user"
  },

  refreshToken: {
    type: String,
    default: ""
  },

  banned: {
    type: Boolean,
    default: false
  },

  freezeWallet: {
    type: Boolean,
    default: false
  },

  disableInvestment: {
    type: Boolean,
    default: false
  },

  disableWithdrawal: {
    type: Boolean,
    default: false
  },

  disableBonus: {
    type: Boolean,
    default: false
  },

  banReason: {
    type: String,
    default: ""
  },

  // 🔹 DOCUMENT INFO
  aadhaar:{
    type:String,
    default:""
  },

  pan:{
    type:String,
    default:""
  },

  aadhaarNumber:{
    type:String,
    default:""
  },

  panNumber:{
    type:String,
    default:""
  },

  referralIncome: {
    type: Number,
    default: 0
  },

  performanceEnabled:{
    type:Boolean,
    default:false
  },

  performanceActivatedAt: {
    type: Date,
    default: null
  },

  performanceActivatedBy: {
    type: String,
    enum: ["AUTO", "ADMIN", "" ],
    default: ""
  },

  performanceCompleted: {
    type: Boolean,
    default: false
  },

  performanceStatus:{
    type:String,
    default:"Pending"
  },

  performanceStartDate:Date,
  performanceExpireDate:Date,

  performanceAdminOverride:{
    type:Boolean,
    default:false
  },

  performanceIncome:{
    type:Number,
    default:0
  },

  royaltyIncome: {
    type: Number,
    default: 0
  },

  referCode: {
    type: String,
    default:""
  },

  current_token: {
    type: String,
    default: null
  },

  // 🔹 TEAM / REFERRAL
  referredBy: {
    type: String,
    default: ""
  },

  accountActive: {
    type: Boolean,
    default: false
  },

  activeStatus: {
    type: String,
    default: "Inactive"
  },

  // 🔹 WALLET SYSTEM
  walletId: {
    type: String,
    unique: true
  },

  monthlyDirects: {
    type: Number,
    default: 0
  },

  balance: {
    type: Number,
    default: 0 
  },

  otbalance: { type: Number, default: 0 },

  // 🔹 MAIN WALLET HISTORY
  history: {
    type: Array,
    default: []
  },

  // 🔹 ONETIME PAGE HISTORY 
  onetimeHistory: [
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId()
      },
      type: { type: String },          
      amount: { type: Number, default: 0 },
      dailyReturn: { type: Number, default: 0 },
      duration: { type: String, default: "" },
      status: { type: String, default: "Pending" }, 
      rejectReason: { type: String, default: "" },
      
      // 🔴 নিচের দুটি ফিল্ড নতুন যোগ করা হলো
      category: { type: String, default: "Beginner" },
      nextReturnDate: { type: Date },

      createdAt: { type: Date, default: Date.now }
    }
  ],

  // এই দুটি ফিল্ড নতুন যোগ করুন 
  todayBalance: {
    type: Number,
    default: 0
  },

  kycSubmittedAt: {
    type: Date,
    default: null
  },

  // 🔹 KYC STATUS
  kycStatus:{
    type:String,
    enum:[
      "Not Submitted",
      "reviewing",
      "approved",
      "rejected"
    ],
    default:"Not Submitted"
  },

  kycRejectReason:{
     type:String,
     default:""
  },

  // 🔹 FILE UPLOAD PATHS
  aadhaarFile: {
    type: String,
    default: ""
  },

  panFile: {
    type: String,
    default: ""
  },

  photo: {
    type: String,
    default: ""
  },

  // 🔹 INVESTMENT SUMMARY
  activeInvestment: {
    amount: Number,
    years: Number,
    startDate: Date,
    maturityDate: Date,
    status: String
  },

  teamIncome: {
    type: Number,
    default: 0
  },

  // 🔹 ACCOUNT STATUS
  isBlocked: {
    type: Boolean,
    default: false
  },

  // 🔹 CREATED TIME
  createdAt: {
    type: Date,
    default: Date.now
  },

  rank: {
    type: String,
    default: "Starter"
  },

  rankPoints: {
    type: Number,
    default: 0
  },

  totalEarning: {
    type: Number,
    default: 0
  },

  totalDirect: {
    type: Number,
    default: 0
  },

  resetOtp: {
    type: String,
    default: null
  },
  
  resetOtpExpire: {
    type: Date,
    default: null
  },

  teamBonusEnabled: {
    type: Boolean,
    default: true
  },

  royaltyBonusEnabled: {
    type: Boolean,
    default: false
  },

  bankDetails: {
    accountNumber: String,
    ifsc: String,
    bankName: String,
    holderName: String
  },

  // 📌 পুশ সাবস্ক্রিপশন
  pushSubscription: {
    type: Object,
    default: null
  },

  hasAppliedBonus: {
    type: Boolean,
    default: false
  },
  
  usedBonusCode: {
    type: String,
    default: ""
  },
  
  bonusCode: {
    type: String,
    default: ""
  },

  bonusRewarded: {
    type: Boolean,
    default: false
  },

  // উইথড্র সিস্টেম আপগ্রেড টাইমার
  upgradeStartTime: {
    type: Date,
    default: null
  },
  
  bonusList: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      amount: { type: Number, default: 300 },
      createdAt: { type: Date, default: Date.now },
      status: { type: String, default: "Success" }
    }
  ]
});

module.exports = mongoose.model("User", userSchema);
