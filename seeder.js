import mongoose from "mongoose";
import dotenv from "dotenv";
import MenuItem from "./models/MenuItem.js";
import menuData from "./data/menuSeed.js";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

const importData = async () => {
  try {
    await MenuItem.deleteMany();
    await MenuItem.insertMany(menuData);

    console.log("Menu Data Imported!");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

importData();