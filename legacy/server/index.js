import express from "express";
import cors from "cors";

const app = express();
const PORT = 5000;

const db = [];

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hi from backend");
});

app.post("/countries", (req, res) => {
  try {
    db.push(req.body.country);
    res.json({
      status: "success",
    });
  } catch (err) {
    console.log(err);
  }
});

app.listen(PORT, () => {
  console.log(`Server has started at port ${PORT}`);
});
