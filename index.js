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

// Store metrics
app.post("/metrics/:username", async (req, res) => {
  const username = req.params.username;
  const { commits, pullRequests, issues, releases } = req.body;

  // Create a new metrics
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
    res.status(200).send("Metrics data stored successfully");
  } catch (error) {
    res.status(500).send("Failed to store metrics data");
  }
});

// Retrieve metrics data by username
app.get("/metrics/:username", async (req, res) => {
  const username = req.params.username;

  try {
    const metricsData = await Metrics.find({ username });
    res.status(200).send(metricsData);
  } catch (error) {
    res.status(500).send("Failed to retrieve metrics data");
  }
});

// Retrieve total metrics for a specific month
app.get("/metrics/:username/:year/:month", async (req, res) => {
  const { username, year, month } = req.params;

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
      res.status(404).send("No metrics found for the specified month");
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

    res.status(200).send({
      totalCommits,
      totalPullRequests,
      totalIssues,
      totalReleases,
    });
  } catch (error) {
    res.status(500).send("Failed to retrieve metrics data");
  }
});

app.listen(port, () => {
  console.log(`Metrics Storage Service is listening on port ${port}`);
});
