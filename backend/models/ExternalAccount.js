import mongoose from "mongoose";

const externalAccountSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      default: "google",
      index: true,
    },
    providerUserEmail: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },
    accessToken: {
      type: String,
      default: "",
    },
    refreshToken: {
      type: String,
      default: "",
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    scope: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

externalAccountSchema.index({ userEmail: 1, provider: 1 }, { unique: true });

const ExternalAccount = mongoose.model("ExternalAccount", externalAccountSchema);

export default ExternalAccount;
