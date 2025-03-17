const ApiUtility = require('../../lib/api-utility');
const searchKeywords = require('../models/search_keyword');

const newsWebsite = module.exports;

newsWebsite.getAllKeywords = async (req, res) => {
    const keywords = await searchKeywords.find();
    res.send(ApiUtility.success(keywords, "Keywords fetched successfully"));
};
  
newsWebsite.getKeywordById = async (req, res) => {
    const { id } = req.params;
    const keyword = await getKeywordById(id,res);
    res.send(ApiUtility.success(keyword, "Keyword fetched successfully"));
};
  
newsWebsite.createKeyword = async (req, res) => {
    const { value } = req.body;
    if (!value) {
        res.send(ApiUtility.failed("value is required", [], 404));
        return;
    }
    const newKeyword = new searchKeywords({ value, label: value });
    const keyword = await newKeyword.save();
    res.send(ApiUtility.success(keyword, "Keyword created successfully"));
};
  
newsWebsite.updateKeyword = async (req, res) => {
    const { id } = req.params;
    const { value } = req.body;
    const keyword = await updateKeyword(id,value, value,res);
    res.send(ApiUtility.success(keyword, "Keyword updated successfully"));
};
  
newsWebsite.deleteKeyword = async (req, res) => {
    const { id } = req.params;
    await deleteKeyword(id,res);
    res.send(ApiUtility.success(null, "Keyword deleted successfully"));
};
  
const getKeywordById = async (id, res) => {
    const url = await searchKeywords.findById(id);
    if (!url) {
        res.send(ApiUtility.failed("Keyword not found", [], 404));
        return;
    }
    return url;
};
  
const updateKeyword = async (
    id,
    value,
    label,
    res
    ) => {
    const data = await searchKeywords.findById(id);
    if (!data) {
        res.send(ApiUtility.failed("Keyword not found", [], 404));
        return;
    }

    data.value = value || data.value;
    data.label = label || data.label;
    return await data.save();
};
  
const deleteKeyword = async (id,res) => {
    const keyword = await searchKeywords.findById(id);
    if (!keyword) {
        res.send(ApiUtility.failed("Keyword not found", [], 404));
        return;
    }
    await keyword.deleteOne();
};
  