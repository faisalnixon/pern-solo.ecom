import express from "express";

const app = express();

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port 3001`);
});