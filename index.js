const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
require("dotenv").config();
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.et32bhj.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const userCollection = client.db("taskDB").collection("users");
    const taskCollection = client.db("taskDB").collection("task");

    // get all users from DB
    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });
    app.get("/userprofile/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    // add a user in DB
    app.post("/user", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exist" });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    //  get user specific Task
    app.get("/mytask/:useremail", async (req, res) => {
      const useremail = req.params.useremail;
      const filter = { useremail: useremail };
      const result = await taskCollection.find(filter).toArray();
      res.send(result);
    });

    //  Add a Task
    app.post("/task", async (req, res) => {
      const task = req.body;
      const result = await taskCollection.insertOne(task);
      res.send(result);
    });

    // get all task
    app.get("/alltask", async (req, res) => {
      const result = await taskCollection.find().toArray();
      res.send(result);
    });

    // get task by id
    app.get("/alltask/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await taskCollection.findOne(query);
      res.send(result);
    });

    // Search Task by title
    const indexKeys = { title: 1, category: 1 };
    const indexOptions = { name: "title" };
    const result = await taskCollection.createIndex(indexKeys, indexOptions);

    app.get("/gettaskbytitle/:text", async (req, res) => {
      const searchText = req.params.text;
      const query = searchText
        ? { title: { $regex: searchText, $options: "i" } }
        : {};
      const result = await taskCollection.find(query).toArray();
      res.send(result);
    });

    // update a task
    app.put("/mytask/:id", async (req, res) => {
      const id = req.params.id;
      const task = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatePost = {
        $set: {
          title: task.title,
          details: task.details,
          date: task.date,
          status: task.status,
        },
      };
      const result = await taskCollection.updateOne(
        filter,
        updatePost,
        options
      );
      res.send(result);
    });

    // delete a task
    app.delete("/deletetask/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await taskCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close()
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Task server is running");
});
app.listen(port, () => {
  console.log(`Task server is running on port ${port}`);
});
