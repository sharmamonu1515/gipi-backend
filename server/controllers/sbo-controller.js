const axios = require("axios");
const KarzaSBO = require("../models/KarzaSBO");
const Karza = require("../lib/karza");
const saveLog = require("../lib/logHelper");
const SBO = module.exports;

SBO.search = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID is required.",
      });
    }

    const requestBody = {
      entityId: id,
      consent: "Y",
    };

    // check if company already exists
    const existingSBO = await KarzaSBO.findOne({ entityId: requestBody.id });

    if (existingSBO) {
      console.log("Returning data from MongoDB database.");
      return res.status(200).send({
        success: true,
        data: existingSBO,
        message: "SBO details fetched successfully.",
      });
    }

    const startTime = Date.now();

    const response = await axios.post(`${await Karza.getAPIBaseURL()}/v1/corp/docs/details/ubo`, requestBody, {
      headers: {
        "Content-Type": "application/json",
        "x-karza-key": await Karza.getAPIKey(),
      },
    });

    const responseTime = Date.now() - startTime;

    await saveLog(req.body.jwtInfo.jwtId, "SBO", responseTime, response.data.statusCode === 101 ? "success" : "failed", requestBody);

    if (response.data.statusCode !== 101) {
      throw new Error("Data not found.");
    }

    // Extract company details from API response
    const sboData = response.data.result || {};
    sboData.createdAt = Date.now();
    sboData.updatedAt = Date.now();

    // save data
    await KarzaSBO.findOneAndUpdate({ entityId: sboData.entityId || requestBody.entityId }, sboData, { upsert: true, new: true });

    return res.status(200).send({
      success: true,
      data: sboData,
      message: "SBO details fetched successfully.",
    });
  } catch (error) {
    console.error("Error fetching SBO data:", error);

    const status = error.response?.status;
    const message = error.response?.data?.message || "Failed to fetch data.";

    if (status === 402) {
      return res.status(402).send({
        success: false,
        message: message || "Payment required or consent issue.",
      });
    }

    return res.status(500).send({
      success: false,
      message: message,
    });
  }
};

SBO.getList = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "" } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const query = search
      ? {
          $or: [{ entityId: { $regex: search, $options: "i" } }, { companyName: { $regex: search, $options: "i" } }],
        }
      : {};

    const projection = {
      _id: 1,
      entityId: 1,
      __v: 1,
      companyName: 1,
      createdAt: 1,
      updatedAt: 1,
      lastDownloaded: 1,
    };

    const totalRecords = await KarzaSBO.countDocuments(query);
    const sbos = await KarzaSBO.find(query, projection)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        sbos,
        pagination: {
          totalRecords,
          totalPages: Math.ceil(totalRecords / limit),
          currentPage: page,
          pageSize: limit,
        },
      },
      message: "SBO list fetched successfully.",
    });
  } catch (error) {
    console.error("Error fetching SBO list:", error);
    return res.status(500).send({
      success: false,
      message: "Failed to fetch SBO list.",
    });
  }
};

SBO.getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "SBO ID is required" });
    }

    const sboDetails = await KarzaSBO.findOne({ entityId: id });
    if (!sboDetails) {
      return res.status(404).json({ success: false, message: "SBO not found" });
    }

    return res.status(200).json({
      success: true,
      data: sboDetails,
      message: "SBO details fetched successfully.",
    });
  } catch (error) {
    console.error("Error fetching SBO details:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch SBO details." });
  }
};
