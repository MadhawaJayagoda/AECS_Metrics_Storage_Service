const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const { mongoose, db } = require("./db_config");
require("dotenv").config();

const port = process.env.PORT || 8000;

app.use(bodyParser.json());

const Metrics = mongoose.model(
  "Metrics",
  new mongoose.Schema({
    username: String,
    timestamp: String,
    commits: Number,
    pullRequests: Number,
    issues: Number,
    releases: Number,
  })
);

// Store metrics data in Mongo DB
app.post("/metrics/:username", async (req, res) => {
  const { username } = req.params;
  const { commits, pullRequests, issues, releases } = req.body;

  // Create a new metrics document
  const metrics = new Metrics({
    username,
    timestamp: new Date().toISOString(),
    commits,
    pullRequests,
    issues,
    releases,
  });

  try {
    await metrics.save();
    res.status(200).json({ message: "Metrics data stored successfully" });
  } catch (error) {
    console.error("Error storing metrics data:", error);
    res.status(500).json({ error: "Failed to store metrics data" });
  }
});

// Retrieve metrics data by username
app.get("/metrics/:username", async (req, res) => {
  const { username } = req.params;

  try {
    // Query MongoDB for metrics data by username
    const metricsData = await Metrics.find({ username });

    res.status(200).json({ metricsData });
  } catch (error) {
    console.error("Error retrieving metrics data:", error);
    res.status(500).json({ error: "Failed to retrieve metrics data" });
  }
});

// Route to retrieve total metrics for a specific month
app.get("/metrics/:username/:year/:month", async (req, res) => {
  const { username, year, month } = req.params;

  // Define the query parameters
  const startOfMonth = new Date(`${year}-${month}-01T00:00:00.000Z`);
  const endOfMonth = new Date(`${year}-${month}-31T23:59:59.999Z`);

  const queryParams = {
    username,
    timestamp: {
      $gte: startOfMonth.toISOString(),
      $lte: endOfMonth.toISOString(),
    },
  };

  try {
    const metricsData = await Metrics.find(queryParams);

    if (metricsData.length === 0) {
      res
        .status(404)
        .json({ error: "No metrics found for the specified month" });
      return;
    }

    // Calculate total metrics for the month
    const totalCommits = metricsData.reduce(
      (sum, data) => sum + data.commits,
      0
    );
    const totalPullRequests = metricsData.reduce(
      (sum, data) => sum + data.pullRequests,
      0
    );
    const totalIssues = metricsData.reduce((sum, data) => sum + data.issues, 0);
    const totalReleases = metricsData.reduce(
      (sum, data) => sum + data.releases,
      0
    );

    res.status(200).json({
      totalCommits,
      totalPullRequests,
      totalIssues,
      totalReleases,
    });
  } catch (error) {
    console.error("Error retrieving metrics data:", error);
    res.status(500).json({ error: "Failed to retrieve metrics data" });
  }
});

app.listen(port, () => {
  console.log(`Metrics Storage Service is listening on port ${port}`);
});
