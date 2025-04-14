const Prompt = require("../models/prompt"); 
const AiController = module.exports;
const axios = require("axios");

/**
 * Create a new prompt
 */
AiController.create = async (req, res) => {
  try {
    const { section, prompt, createdBy, temperature, maxOutputTokens, topP, topK } = req.body;

    if (!section || !prompt || !createdBy) {
      return res.status(400).json({
        success: false,
        message: "Section, prompt, and createdBy are required.",
      });
    }

    const newPrompt = new Prompt({
      section,
      prompt,
      createdBy,
      editedBy: null,
      temperature: temperature || 0.7,
      maxOutputTokens: maxOutputTokens || 256,
      topP: topP || 1,
      topK: topK || 50,
      date: Date.now(),
    });

    await newPrompt.save();

    return res.status(201).json({
      success: true,
      data: newPrompt,
      message: "Prompt created successfully.",
    });
  } catch (error) {
    console.error("Error creating prompt:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create prompt.",
    });
  }
};

/**
 * Update an existing prompt
 */
AiController.update = async (req, res) => {
  try {
    const { id, prompt, editedBy, temperature, maxOutputTokens, topP, topK } = req.body;

    if (!id || !prompt || !editedBy) {
      return res.status(400).json({
        success: false,
        message: "ID, prompt, and editedBy are required.",
      });
    }

    const updatedPrompt = await Prompt.findByIdAndUpdate(
      id,
      {
        prompt,
        editedBy,
        temperature: temperature || 0.7,
        maxOutputTokens: maxOutputTokens || 256,
        topP: topP || 1,
        topK: topK || 50,
        date: Date.now(),
      },
      { new: true }
    );

    if (!updatedPrompt) {
      return res.status(404).json({
        success: false,
        message: "Prompt not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedPrompt,
      message: "Prompt updated successfully.",
    });
  } catch (error) {
    console.error("Error updating prompt:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update prompt.",
    });
  }
};

/**
 * Summarize content using a prompt and ChatGPT API
 */
AiController.summarize = async (req, res) => {
    try {
        const { content, section } = req.body;
    
        if (!content || !section) {
            return res.status(400).json({
            success: false,
            message: "Content and section are required.",
            });
        }
    
        const promptData = await Prompt.findOne({ section }).sort({ date: -1 });
    
        if (!promptData) {
            return res.status(404).json({
            success: false,
            message: "No prompt found for the given section.",
            });
        } 
  
        const prompt = promptData.prompt;
  
        const combinedText = `${prompt}\n\n${content}`;

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
        const body = {
            contents: [
                {
                    parts: [
                        {
                            text: combinedText,
                        },
                    ],
                },
            ],
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                },
            ],
            generationConfig: {
                temperature: 0.5,
                maxOutputTokens: promptData && promptData.maxOutputTokens,
                topP: promptData.topP,
                topK: promptData.topK,
            },
        };

        const response = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, body, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const summary = response.data.candidates[0].content.parts[0].text || 'No summary generated';

        return res.status(200).json({
            success: true,
            summary,
            message: "Content summarized successfully.",
        });
    } catch (error) {
        console.error("Error summarizing content:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to summarize content.",
        });
    }
};

/**
 * Fetch the latest prompt by section name
 */
AiController.getBySection = async (req, res) => {
    try {
      const { section } = req.query;
  
      if (!section) {
        return res.status(400).json({
          success: false,
          message: "Section is required.",
        });
      }
  
      const promptData = await Prompt.findOne({ section }).sort({ date: -1 });
  
      if (!promptData) {
        return res.status(404).json({
          success: false,
          message: "No prompt found for the given section.",
        });
      }
    
      return res.status(200).json({
        success: true,
        data: promptData,
        message: "Prompt fetched successfully.",
      });
    } catch (error) {
      console.error("Error fetching prompt:", error.message);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch prompt.",
      });
    }
  };
