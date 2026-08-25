const Content = require("../models/content");

const validPageTypes = ["landing", "faq", "about", "privacy", "terms", "contact"];

// GET content
exports.getContent = async (req, res) => {
  try {
    const { pageType } = req.params;

    if (!validPageTypes.includes(pageType)) {
      return res.status(404).json({
        success: false,
        message: "Page not found",
      });
    }

    const contentDoc = await Content.findOne({ pageType }).lean();

    return res.json({
      success: true,
      data: contentDoc ? contentDoc.data : {},
    });
  } catch (error) {
    console.error(`Error fetching ${req.params.pageType} content:`, error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch content",
      error: error.message,
    });
  }
};

// PUT update content
exports.updateContent = async (req, res) => {
  try {
    const { pageType } = req.params;

    if (!validPageTypes.includes(pageType)) {
      return res.status(404).json({
        success: false,
        message: "Page not found",
      });
    }

    const contentData = req.body;

    const updatedDoc = await Content.findOneAndUpdate(
      { pageType },
      { pageType, data: contentData },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    ).lean();

    return res.json({
      success: true,
      message: `${pageType} content updated successfully`,
      data: updatedDoc.data,
    });
  } catch (error) {
    console.error(`Error updating ${req.params.pageType} content:`, error);
    return res.status(500).json({
      success: false,
      message: "Failed to update content",
      error: error.message,
    });
  }
};

// POST reset content
exports.resetContent = async (req, res) => {
  try {
    const { pageType } = req.params;

    if (!validPageTypes.includes(pageType)) {
      return res.status(404).json({
        success: false,
        message: "Page not found",
      });
    }

    // Uncomment if you want admin-only access
    // if (!req.user || !req.user.admin) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Admin access required",
    //   });
    // }

    await Content.findOneAndDelete({ pageType });

    return res.json({
      success: true,
      message: `${pageType} content reset to defaults`,
      data: {},
    });
  } catch (error) {
    console.error(`Error resetting ${req.params.pageType} content:`, error);
    return res.status(500).json({
      success: false,
      message: "Failed to reset content",
      error: error.message,
    });
  }
};