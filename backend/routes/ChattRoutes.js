const express = require("express");
const router = express.Router();

router.post("/ask", async (req, res) => {
  try {

    const { message, step, userName } = req.body;
    const msg = message.toLowerCase();

    let reply = "";
    let nextStep = step;

    // STEP 1 - Start chat
    if (step === "start") {

      if (msg.includes("hi") || msg.includes("hello")) {
        reply = "Hi 👋 What is your name?";
        nextStep = "getName";
      } else {
        reply = "Please type 'Hi' to start the chat.";
      }
    }

    // STEP 2 - Get user name
    else if (step === "getName") {

      reply = `Nice to meet you ${message}! How can I help you today?`;

      nextStep = "showOptions";
    }

    // STEP 3 - Show options
    else if (step === "showOptions") {

      if (msg === "1" || msg.includes("found")) {

        reply =
`📌 Found Item Process

1️⃣ User finds an item on campus  
2️⃣ Click "Report Found Item"  
3️⃣ Enter details (location, date, description)  
4️⃣ System marks item as "Found / Claimable"  
5️⃣ Lost owner submits claim  
6️⃣ Finder reviews claim  
7️⃣ If approved → Item returned to owner`;

        nextStep = "end";
      }

      else if (msg === "2" || msg.includes("lost")) {

        reply =
`📌 Lost Item Process

1️⃣ User loses an item  
2️⃣ Search for item in Found Items list  
3️⃣ If item matches → Click "Claim Item"  
4️⃣ Provide details to prove ownership  
5️⃣ Finder reviews claim  
6️⃣ If approved → Arrange pickup`;

        nextStep = "end";
      }

      else if (msg === "3" || msg.includes("about")) {

        reply =
`📌 About Our System

This system helps students report lost or found items on campus.

Features:
• Report Found Items
• Search Lost Items
• Submit Claims
• Secure claim approval by finder
• Campus notices & alerts`;

        nextStep = "end";
      }

      else {

        reply = "Please select one of the options.";
      }
    }

    else if (step === "end") {
      reply = "If you need help again, type 'Hi' to restart the chat.";
      nextStep = "start";
    }

    res.json({
      reply,
      nextStep
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      reply: "Something went wrong.",
      nextStep: "start"
    });

  }
});

module.exports = router;