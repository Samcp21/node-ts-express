import mongoose, { Schema } from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: [true, "Name is required"], unique: true },
  available: { type: Boolean, default: true },
  price: { type: Number, default: 0 },
  description: {
    type: String,
    required: false,
  },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

export const ProductModel = mongoose.model("Product", productSchema);
