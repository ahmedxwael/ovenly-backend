import { hashString, only, verifyHashedString } from "@/shared/utils";
import { Document, model, Schema } from "mongoose";
import { User as UserType } from "../types";
import { USER_PUBLIC_FIELDS } from "../utils/consts";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: {
        value: true,
        message: "Name is required",
      },
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: {
        value: true,
        message: "Password is required",
      },
    },
    accessToken: {
      type: String,
      default: "",
    },
    refreshToken: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    incomes: {
      type: Array,
      default: [],
    },
    expenses: {
      type: Array,
      default: [],
    },
    goals: {
      type: Array,
      default: [],
    },
    balance: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    totalIncomes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  const user = this as unknown as UserType & Document;

  if (!user.isModified("password")) {
    return next();
  }

  user.password = await hashString(user.password);
  next();
});

userSchema.methods.comparePassword = async function (password: string) {
  const user = this as unknown as UserType & Document;

  return await verifyHashedString(password, user.password).catch(() => false);
};

const formatUser = (user: UserType & Document) => {
  const userObject = {
    id: user._id,
    ...user.toObject(),
  };

  return only(userObject, USER_PUBLIC_FIELDS);
};

userSchema.methods.toJSON = function () {
  const user = this as unknown as UserType & Document;

  return formatUser(user);
};

userSchema.index({ name: 1 });
userSchema.index({ role: 1 });
userSchema.index({ incomes: 1 });
userSchema.index({ expenses: 1 });
userSchema.index({ goals: 1 });
userSchema.index({ balance: 1 });
userSchema.index({ currency: 1 });

export const User = model("user", userSchema);
