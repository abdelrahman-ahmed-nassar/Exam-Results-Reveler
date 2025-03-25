const quizResults = [];

// Fetch results when the page loads
fetch("results.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then((data) => {
    // Clear any existing results and add fetched data
    quizResults.length = 0;
    quizResults.push(...(Array.isArray(data) ? data : Object.values(data)));
    
    // Optional: Enable submit button or perform any initialization after data is loaded
    document.getElementById("submitBtn")?.removeAttribute("disabled");
  })
  .catch((error) => {
    console.error("Error fetching quiz results:", error);
    const resultDiv = document.getElementById("result");
    if (resultDiv) {
      resultDiv.innerHTML = "حدث خطأ في تحميل النتائج. يرجى المحاولة لاحقًا.";
      resultDiv.className = "result error";
    }
  });

function calculateRanking(quizResults) {
  // First, group results by score
  const groupedResults = {};
  quizResults.forEach((result) => {
    const score = parseInt(result.score.split("/")[0]);
    if (!groupedResults[score]) {
      groupedResults[score] = [];
    }
    groupedResults[score].push(result);
  });

  // Sort each score group
  Object.keys(groupedResults).forEach((score) => {
    groupedResults[score].sort((a, b) => {
      // Prioritize "In time" submissions
      const isAInTime = a.formTimer.includes("In time");
      const isBInTime = b.formTimer.includes("In time");

      if (isAInTime && !isBInTime) return -1;
      if (!isAInTime && isBInTime) return 1;

      // Parse timer for comparison
      const parseTimer = (timerString) => {
        const match = timerString.match(/(\+)?\s*(\d+)m?\s*(\d+)s/);
        if (match) {
          const isLate = match[1] === "+";
          const minutes = parseInt(match[2] || "0");
          const seconds = parseInt(match[3]);
          return {
            totalSeconds: minutes * 60 + seconds,
            isLate,
          };
        }
        return { totalSeconds: Infinity, isLate: false };
      };

      // Compare timer details
      const timerA = parseTimer(a.formTimer);
      const timerB = parseTimer(b.formTimer);

      // First, check late status
      if (timerA.isLate !== timerB.isLate) {
        return timerA.isLate ? 1 : -1;
      }

      // Then compare total seconds
      return timerA.totalSeconds - timerB.totalSeconds;
    });
  });

  // Flatten and assign ranks
  const rankedResults = [];
  let currentRank = 1;

  Object.keys(groupedResults)
    .sort((a, b) => parseInt(b) - parseInt(a)) // Sort scores in descending order
    .forEach((score) => {
      const group = groupedResults[score];

      group.forEach((result, index) => {
        rankedResults.push({
          ...result,
          rank: currentRank + index,
        });
      });

      // Move to next rank after processing the group
      currentRank += group.length;
    });

  return rankedResults;
}

function checkResults() {
  const emailInput = document.getElementById("emailInput");
  const resultDiv = document.getElementById("result");
  const enteredEmail = emailInput.value.trim().toLowerCase();

  if (!enteredEmail) {
    resultDiv.innerHTML = "الرجاء إدخال البريد الإلكتروني";
    resultDiv.className = "result error";
    return;
  }

  // Check if results are loaded
  if (quizResults.length === 0) {
    resultDiv.innerHTML = "جاري تحميل النتائج. يرجى الانتظار.";
    resultDiv.className = "result error";
    return;
  }

  // Calculate rankings first
  const rankedResults = calculateRanking(quizResults);

  const matchedResult = rankedResults.find(
    (result) => result.email.trim().toLowerCase() === enteredEmail
  );

  if (matchedResult) {
    resultDiv.innerHTML = `
      <strong>الاسم:</strong> ${matchedResult.fullName}<br>
      <strong>النتيجة:</strong> ${matchedResult.score}<br>
      <strong>المركز:</strong> ${matchedResult.rank}<br>
      <strong>وقت التسليم:</strong> ${matchedResult.timestamp}<br>
      <strong>مدة الاختبار:</strong> ${matchedResult.formTimer}
    `;
    resultDiv.className = "result success";
  } else {
    resultDiv.innerHTML =
      "عذراً، لم يتم العثور على نتيجة لهذا البريد الإلكتروني";
    resultDiv.className = "result error";
  }
}

// Optional: Add event listener for form submission
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('emailForm');
  const submitBtn = document.getElementById('submitBtn');
  
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      checkResults();
    });
  }

  // Disable submit button until results are loaded
  if (submitBtn) {
    submitBtn.setAttribute("disabled", "true");
  }
});