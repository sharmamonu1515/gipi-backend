const ApiUtility = require('../../lib/api-utility');
const searchWebsites = require('../models/search_website');

const newsWebsite = module.exports;

newsWebsite.getAllWebsites = async function getAllWebsites(req, res) {
    const keywords = await searchWebsites.find({});
    res.send(ApiUtility.success(keywords, "Websites fetched successfully"));
};
  
newsWebsite.getWebsiteById = async function getWebsiteById(req, res) {
    const { id } = req.params;
    const website = await searchWebsites.findById(id);
    if (!website) {
        res.send(ApiUtility.failed("Website not found", [], 404));
        return;
    }
    res.send(ApiUtility.success(website, "Website fetched successfully"));
};
  
newsWebsite.createWebsite = async function createWebsite(req, res) {
    const { name, url } = req.body;
    if (!name || !url) {
        res.send(ApiUtility.failed("Value and label are required", [], 404));
        return;
    }
    const newKeyword = new searchWebsites({ name, url }).save();
    res.send(ApiUtility.success(newKeyword, "website link created successfully"));
};
  
newsWebsite.updateWebsite = async function updateWebsite(req, res) {
    const { id } = req.params;
    const { name, url } = req.body;
    const data = await searchWebsites.findById(id);
    if (!data) {
        res.send(ApiUtility.failed("Website not found", [], 404));
        return;
    }

    data.name = name || data.name;
    data.url = url || data.url;
    const website =  await data.save();
    res.send(ApiUtility.success(website, "Website link updated successfully"));
};
  
newsWebsite.deleteWebsite = async function deleteWebsite(req, res) {
    const { id } = req.params;
    const website = await searchWebsites.findById(id);
    if (!website) {
        res.send(ApiUtility.failed("Website not found", [], 404));
        return;
    }
    await website.deleteOne();
    res.send(ApiUtility.success(null, "Website deleted successfully"));
};
  