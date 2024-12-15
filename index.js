const textInput = document.getElementById("textInput");
const charCount = document.getElementById("charCount");
const wordCount = document.getElementById("wordCount");
const splitLengthInput = document.getElementById("splitLength");
const numPartsInput = document.getElementById("numParts");
const confirmBtn = document.getElementById("confirmBtn");
const clearBtn = document.getElementById("clearBtn");
const buttonContainer = document.getElementById("buttonContainer");
const notification = document.getElementById("notification");
const splitOptions = document.getElementsByName("splitOption");
const enableStartText = document.getElementById("enableStartText");
const startTextInputContainer = document.getElementById("startTextInputContainer");
const startTextInput = document.getElementById("startText");

// Load start text from local storage on page load
window.addEventListener("DOMContentLoaded", () => {
  const savedStartText = localStorage.getItem("startText");
  if (savedStartText) {
    startTextInput.value = savedStartText;
  }

  const isStartTextEnabled = localStorage.getItem("enableStartText") === "true";
  enableStartText.checked = isStartTextEnabled;
  toggleStartTextInput(isStartTextEnabled);

  // Set "Split by Parts" as the default option
  document.querySelector('input[value="parts"]').checked = true;

  // Ensure correct input is enabled for split options
  updateSplitOptionInputs();
});

// Save start text to local storage whenever it changes
startTextInput.addEventListener("input", () => {
  localStorage.setItem("startText", startTextInput.value);
});

// Toggle the visibility of the start text input field
enableStartText.addEventListener("change", () => {
  const isChecked = enableStartText.checked;
  localStorage.setItem("enableStartText", isChecked);
  toggleStartTextInput(isChecked);
});

// Function to toggle start text input visibility
function toggleStartTextInput(show) {
  if (show) {
    startTextInputContainer.classList.remove("hidden");
  } else {
    startTextInputContainer.classList.add("hidden");
  }
}

// Enable or disable inputs based on the split option
splitOptions.forEach((option) => {
  option.addEventListener("change", updateSplitOptionInputs);
});

function updateSplitOptionInputs() {
  const selectedOption = [...splitOptions].find((option) => option.checked).value;

  if (selectedOption === "characters") {
    splitLengthInput.disabled = false;
    numPartsInput.disabled = true;
    numPartsInput.value = ""; // Clear input when disabled
  } else if (selectedOption === "parts") {
    splitLengthInput.disabled = true;
    numPartsInput.disabled = false;
    splitLengthInput.value = ""; // Clear input when disabled
  }
}

// Update character and word count in real-time (including paste event)
textInput.addEventListener("input", updateCounts);
textInput.addEventListener("paste", () => {
  setTimeout(updateCounts, 0); // Wait for paste action to complete
});

function updateCounts() {
  const text = textInput.value;
  charCount.textContent = `Character Count: ${text.length}`;
  wordCount.textContent = `Word Count: ${text.split(/\s+/).filter(Boolean).length}`;
}

// Show notification
function showNotification(message) {
  notification.textContent = message;
  notification.classList.remove("hidden");
  notification.classList.add("show");

  // Hide notification after 2 seconds
  setTimeout(() => {
    notification.classList.remove("show");
    notification.classList.add("hidden");
  }, 2000);
}

// Split text into parts respecting sentence boundaries
function splitTextIntoParts(text, numParts) {
  const sentences = text.match(/[^.!?]+[.!?]*/g) || []; // Split text into sentences
  const parts = [];
  const avgPartSize = Math.ceil(sentences.length / numParts); // Target number of sentences per part

  let currentPart = [];
  sentences.forEach((sentence) => {
    currentPart.push(sentence.trim());

    // If the current part reaches the average size and it's not the last part, finalize it
    if (currentPart.length >= avgPartSize && parts.length < numParts - 1) {
      parts.push(currentPart.join(" "));
      currentPart = [];
    }
  });

  // Push the last part (including any leftover sentences)
  if (currentPart.length > 0) {
    parts.push(currentPart.join(" "));
  }

  return parts;
}

// Handle confirm button click
confirmBtn.addEventListener("click", () => {
  const text = textInput.value;
  const splitLength = parseInt(splitLengthInput.value, 10);
  const numParts = parseInt(numPartsInput.value, 10);
  const selectedOption = [...splitOptions].find((option) => option.checked).value;
  const startText = enableStartText.checked ? startTextInput.value.trim() : "";

  // Clear existing buttons
  buttonContainer.innerHTML = "";

  if (!text) {
    showNotification("Please enter some text to split.");
    return;
  }

  let parts = [];

  // Split logic based on the selected option
  if (selectedOption === "characters") {
    if (!splitLength || splitLength <= 0) {
      showNotification("Please enter a valid number for characters per split.");
      return;
    }

    let currentIndex = 0;
    while (currentIndex < text.length) {
      let chunk = text.slice(currentIndex, currentIndex + splitLength);

      // Ensure no word is split in the middle
      if (chunk[chunk.length - 1] !== " " && currentIndex + splitLength < text.length) {
        const lastSpaceIndex = chunk.lastIndexOf(" ");
        if (lastSpaceIndex !== -1) {
          chunk = chunk.slice(0, lastSpaceIndex);
        }
      }

      parts.push(chunk.trim());
      currentIndex += chunk.length;

      // Skip leading spaces for the next chunk
      while (text[currentIndex] === " ") {
        currentIndex++;
      }
    }
  } else if (selectedOption === "parts") {
    if (!numParts || numParts <= 0) {
      showNotification("Please enter a valid number of parts.");
      return;
    }

    // Updated logic to split text into parts based on sentences
    parts = splitTextIntoParts(text, numParts);
  }

  // Add buttons for each part
  parts.forEach((part, index) => {
    const partWordCount = part.split(/\s+/).filter(Boolean).length;
    const partCharCount = part.length;

    // Add optional text first, then "Translate to English"
    const finalPart = startText ? `${startText} Translate to English: ${part}` : `Translate to English: ${part}`;

    // Create button element
    const button = document.createElement("button");
    button.classList.add("copy-btn");

    // Add part number and mini text (character/word count)
    button.innerHTML = `
      <span>Copy Part ${index + 1}</span>
      <small>(${finalPart.length} chars, ${finalPart.split(/\s+/).filter(Boolean).length} words)</small>
    `;

    // Add click event to copy the part to the clipboard
    button.addEventListener("click", () => {
      navigator.clipboard.writeText(finalPart).then(() => {
        showNotification(`Copied Part ${index + 1}!`);
      });
    });

    buttonContainer.appendChild(button);
  });
});

// Handle clear button click
clearBtn.addEventListener("click", () => {
  textInput.value = "";
  charCount.textContent = "Character Count: 0";
  wordCount.textContent = "Word Count: 0";
  buttonContainer.innerHTML = "";
});