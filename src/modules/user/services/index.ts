import { User } from "../models";
import { User as UserType } from "../types";

export async function createUserService(user: UserType) {
  try {
    const existingUser = await User.findOne({ email: user.email });

    if (existingUser) {
      throw new Error("User already exists");
    }

    const newUser = await User.create(user);
    console.log("user created", newUser);
    return newUser;
  } catch (error) {
    throw error;
  }
}
