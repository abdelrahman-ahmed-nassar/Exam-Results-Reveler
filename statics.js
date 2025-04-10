let quizResults = [];

fetch("results.json")
  .then((response) => response.json())
  .then((data) => {
    // Store the data in an array
    quizResults = Array.isArray(data) ? data : Object.values(data);

    // Call the data processing and chart creation functions after data is loaded
    processData();
  })
  .catch((error) => {
    quizResults = [];
    console.error("Error reading JSON file:", error);
  });

function processData() {
  // Data Processing
  const processedScores = quizResults.map((result) =>
    parseInt(result.score.split("/")[0])
  );

  const processedTimes = quizResults.map((result) => {
    const timeStr = result.formTimer.match(/\((\d+)m (\d+)s\)/);
    return timeStr ? parseInt(timeStr[1]) * 60 + parseInt(timeStr[2]) : 0;
  });

  // Score Distribution Chart
  new Chart(document.getElementById("scoreDistributionChart"), {
    type: "bar",
    data: {
      labels: ["أقل من 35", "35-39", "40-44", "45-49", "50"],
      datasets: [
        {
          label: "عدد المشاركين",
          data: [
            processedScores.filter((s) => s < 35).length,
            processedScores.filter((s) => s >= 35 && s < 40).length,
            processedScores.filter((s) => s >= 40 && s < 45).length,
            processedScores.filter((s) => s >= 45 && s < 50).length,
            processedScores.filter((s) => s === 50).length,
          ],
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: "توزيع الدرجات" },
      },
    },
  });

  // Time Spent Chart
  new Chart(document.getElementById("timeSpentChart"), {
    type: "pie",
    data: {
      labels: [
        "أقل من 10 دقائق",
        "10-15 دقائق",
        "15-20 دقائق",
        "20-25 دقائق",
        "أكثر من 25 دقائق",
      ],
      datasets: [
        {
          data: [
            processedTimes.filter((t) => t < 600).length,
            processedTimes.filter((t) => t >= 600 && t < 900).length,
            processedTimes.filter((t) => t >= 900 && t < 1200).length,
            processedTimes.filter((t) => t >= 1200 && t < 1500).length,
            processedTimes.filter((t) => t >= 1500).length,
          ],
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: "توزيع وقت الاختبار" },
      },
    },
  });

  // Score Frequency Chart
  new Chart(document.getElementById("scoreFrequencyChart"), {
    type: "line",
    data: {
      labels: processedScores.sort((a, b) => a - b),
      datasets: [
        {
          label: "تكرار الدرجات",
          data: processedScores
            .sort((a, b) => a - b)
            .reduce((acc, score) => {
              acc[score] = (acc[score] || 0) + 1;
              return acc;
            }, {}),
          borderColor: "#8A4FFF",
          backgroundColor: "rgba(138, 79, 255, 0.2)",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: "تكرار الدرجات" },
      },
    },
  });

  // Category Comparison Chart
  new Chart(document.getElementById("categoryComparisonChart"), {
    type: "radar",
    data: {
      labels: ["أقل من 35", "35-39", "40-44", "45-49", "50"],
      datasets: [
        {
          label: "توزيع الدرجات",
          data: [
            processedScores.filter((s) => s < 35).length,
            processedScores.filter((s) => s >= 35 && s < 40).length,
            processedScores.filter((s) => s >= 40 && s < 45).length,
            processedScores.filter((s) => s >= 45 && s < 50).length,
            processedScores.filter((s) => s === 50).length,
          ],
          backgroundColor: "rgba(138, 79, 255, 0.2)",
          borderColor: "#8A4FFF",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: "مقارنة فئات الدرجات" },
      },
    },
  });
  // Top Performers with Advanced Sorting
  const topPerformers = quizResults
    .sort((a, b) => {
      // Parse scores
      const scoreA = parseInt(a.score.split("/")[0].trim());
      const scoreB = parseInt(b.score.split("/")[0].trim());

      // First, compare scores (descending order)
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      // Parse timer for comparison
      const parseTimer = (timerString) => {
        // Check if "In time"
        if (timerString.includes("In time")) {
          const match = timerString.match(/\((\d+)m\s*(\d+)s\)/);
          if (match) {
            const minutes = parseInt(match[1] || "0");
            const seconds = parseInt(match[2]);
            return {
              totalSeconds: minutes * 60 + seconds,
              isLate: false,
            };
          }
        }

        // Check if "Late"
        if (timerString.includes("Late")) {
          const match = timerString.match(/\+\s*(\d+)s/);
          if (match) {
            const seconds = parseInt(match[1]);
            return {
              totalSeconds: seconds,
              isLate: true,
            };
          }
        }

        return { totalSeconds: Infinity, isLate: true };
      };

      // Parse timers
      const timerA = parseTimer(a.formTimer);
      const timerB = parseTimer(b.formTimer);

      // If scores are the same, prioritize late submissions
      // (meaning late submissions will be sorted after in-time submissions)
      if (timerA.isLate !== timerB.isLate) {
        return timerA.isLate ? 1 : -1;
      }

      // If both are in the same late/in-time category, compare total seconds
      return timerA.totalSeconds - timerB.totalSeconds;
    })
    .slice(0, 20);

  const topPerformersDiv = document.getElementById("topPerformers");
  topPerformers.forEach((performer, index) => {
    const performerDiv = document.createElement("div");
    performerDiv.classList.add("performer-item");
    performerDiv.innerHTML = `
    <strong>${index + 1}. ${performer.name}</strong>
    <p>Score: ${performer.score}</p>
  `;
    topPerformersDiv.appendChild(performerDiv);
  });
}
