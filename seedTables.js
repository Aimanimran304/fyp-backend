// seeder.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Table from "./models/Table.js";

dotenv.config();

const seedTables = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    await Table.deleteMany({});
    console.log("🗑️  Old tables cleared");

    const areas = ["indoor", "terrace", "rooftop"];
    const tables = [];

    areas.forEach((area) => {
      for (let i = 1; i <= 10; i++) {
        tables.push({
          tableNumber: `${area}-${i}`,
          area:        area,
          status:      "available"
        });
      }
    });

    await Table.insertMany(tables);
    console.log("✅ 30 tables seeded (10 per area)!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeder error:", error);
    process.exit(1);
  }
};

seedTables();