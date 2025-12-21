// Main branch update + JSON parsing fix
// Experimental API testing code
// Main branch update for chatbot logic
// UI feature enhancement added
// API configuration - Using Supabase Edge Function
const API_URL =
  "https://asjewfkzgrhstvmvmdqn.supabase.co/functions/v1/gemini-call";
// Supabase anon key (safe to expose - it's public)
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzamV3Zmt6Z3Joc3R2bXZtZHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNTEyNjIsImV4cCI6MjA4MTgyNzI2Mn0.nYCWAaJoYgGEa2umcaLiEtMF-7o3K2j_UqRSpdlt2zg";

// DOM elements
const chatMessages = document.getElementById("chat-messages");
const materialsInput = document.getElementById("materials-input");
const sendButton = document.getElementById("send-btn");
const loadingIndicator = document.getElementById("loading");

// Add event listener for Enter key
materialsInput.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    getExperiments();
  }
});

// Initialize the chat with a welcome message
document.addEventListener("DOMContentLoaded", function () {
  displayBotMessage(`
        <p>Hello! I'm your Science Experiment Chatbot. I can suggest fun and educational experiments based on the materials you have available.</p>
        <p>Simply enter the materials you have, separated by commas, or click on the suggested materials above to get started!</p>
    `);
});

// Function to add material from suggestions to input
function addMaterial(material) {
  if (materialsInput.value === "") {
    materialsInput.value = material;
  } else if (!materialsInput.value.includes(material)) {
    materialsInput.value += `, ${material}`;
  }
  materialsInput.focus();
}

// Function to display user message
function displayUserMessage(message) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message-row", "user");
  messageElement.innerHTML = `
    <div class="message-content">
      <div class="message-avatar"><i class="fas fa-user"></i></div>
      <div class="message-text"><p>${message}</p></div>
    </div>
  `;
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Function to display bot message
function displayBotMessage(message) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message-row", "bot");
  messageElement.innerHTML = `
    <div class="message-content">
      <div class="message-avatar"><i class="fas fa-flask"></i></div>
      <div class="message-text">${message}</div>
    </div>
  `;
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Function to get experiment suggestions from Gemini API
async function getExperiments() {
  const materials = materialsInput.value.trim();

  if (!materials) {
    displayBotMessage(
      "<p>Please enter some materials to get experiment suggestions.</p>"
    );
    return;
  }

  // Display user's materials
  displayUserMessage(materials);

  // Show loading indicator
  loadingIndicator.classList.remove("hidden");

  // Clear input field
  materialsInput.value = "";

  try {
    const prompt = `You are a helpful science education assistant. I have the following materials: ${materials}. 
Suggest 1 fun, safe, and educational science experiments I can do with these materials.
If the user asks about anything unrelated to science experiments, respond with this exact JSON:
{
  "experiments": [
    {
      "description": "Sorry, I can only help with science experiments. Please provide materials for experiments."
    }
  ]
}
For valid experiment requests, format your response in strict JSON with the following structure:
{
  "experiments": [
    {
      "title": "Experiment Title",
      "description": "Brief description of what this experiment demonstrates",
      "difficulty": "Easy/Medium/Hard",
      "time": "Estimated time to complete",
      "materials": ["list", "of", "required", "materials"],
      "steps": ["step 1", "step 2", "step 3"],
      "scientificExplanation": "Brief explanation of the science behind this experiment"
    }
  ]
}
Only return valid JSON, no other text or explanations.`;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();

    // Debug: log the full response to see its structure
    console.log("Full API response:", data);

    // Hide loading indicator
    loadingIndicator.classList.add("hidden");

    // Extract text from response
    const responseText = data.text;

    if (!responseText) {
      throw new Error("Empty response from API");
    }

    // Try to parse the JSON response
    try {
      console.log(responseText);

      // Find JSON content in the response (in case there's additional text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : responseText;

      const experiments = JSON.parse(jsonString);

      if (!experiments.experiments || !Array.isArray(experiments.experiments)) {
        throw new Error("Invalid experiments data structure");
      }

      // Display experiments
      let experimentsHTML = `<p>AI Response</p>`;

      experiments.experiments.forEach((exp, index) => {
        experimentsHTML += `
                    <div class="experiment-card">
                        <h3>${exp.title}</h3>
                        <p><strong>Description:</strong> ${exp.description}</p>
                        <p><strong>Difficulty:</strong> ${
                          exp.difficulty
                        } | <strong>Time:</strong> ${exp.time}</p>
                        <p><strong>Materials needed:</strong> ${exp.materials.join(
                          ", "
                        )}</p>
                        <p><strong>Steps:</strong></p>
                        <ol class="experiment-steps">
                            ${exp.steps
                              .map((step) => `<li>${step}</li>`)
                              .join("")}
                        </ol>
                        <p><strong>Scientific Explanation:</strong> ${
                          exp.scientificExplanation
                        }</p>
                    </div>
                `;
      });

      displayBotMessage(experimentsHTML);
    } catch (jsonError) {
      console.error("JSON parsing error:", jsonError);

      let experimentsHTML = "";

      // Find JSON content in the response (in case there's additional text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : responseText;

      const experiments = JSON.parse(jsonString);

      experiments.experiments.forEach((exp, index) => {
        experimentsHTML += `
                          <div class="experiment-card">
                              <p>${exp.description}</p>
                          </div>`;
      });

      displayBotMessage(experimentsHTML);
    }
  } catch (error) {
    console.error("Error fetching experiments:", error);

    // Hide loading indicator
    loadingIndicator.classList.add("hidden");

    // Display error message
    displayBotMessage(`
            <p>Sorry, I encountered an error while finding experiments. Please try again with different materials or check your connection.</p>
            <p>Error: ${error.message}</p>
        `);
  }
}

function addElement() {
  let newPra = document.createElement("p");
  newPra.textContent = "New paragraph added!";
  document.getElementById("chat-messages").appendChild(newPra);
}

let email = "sdsd";
let emailError = "";
let emailPatter = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
