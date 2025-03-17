'use strict'

const express = require('express');
const router = express.Router();
const config = require('./config');
const logger = require('../utils/logger')(module);
const amazonS3 = require('./controllers/amazon-s3');
const auth = require('../lib/auth');
const multer = require('multer');
const path = require('path');
const upload = multer({ dest: path.join(__dirname, '..', 'client', 'public') });
const { 
  importExcelData,
  events,
  searchData,
  getAllLogs, 
  saveLog,
  clearUploadsDirectory
 } = require('../server/controllers/dataset.ctrl');
/*
 * CONTROLLERS
 */
 const userController = require('./controllers/user-controller');
 const razorPay = require('./controllers/razorpay-controller');
 const companyController = require('./controllers/compay-controller');
 const countryController = require('./controllers/countries-controller');
 const ofacController = require('./controllers/ofac-controller');
 const mcaController = require('./controllers/mca-controller');
 const mcaSignatoryController = require('./controllers/mca-signatory-controller');
 const gstController = require('./controllers/gov-gst-controller');
 const gipiUserController = require('./controllers/gipi-user-controller');
 const empCheckDateController = require('./controllers/emp-date-check-controller');
 const newMcaController = require('./controllers/new-mca-controller');
 const litigationBiController = require('./controllers/litigation-bi-controller')
 const awsController = require('./controllers/aws-s3sdk-controller');
 const probController = require('./controllers/prob-controller');
 const researchController = require('./controllers/research-controller');
 const searchKeywordController = require('./controllers/search-keyword-controller');
 const newsWebsiteController = require('./controllers/news-website-controller');

/*
 * ROUTER MIDDLEWARE
 */
//All routes will be redirect to HTTPS on production
var https_port = process.env.HTTPS_PORT || '';
if (config.express.isOnProduction || https_port) {
    router.use(function(req, res, next) {
        var host = req.get('host');
        //console.log("host = " + host + ", protocol: " + req.protocol);
        if (req.get('x-forwarded-proto') != "https" && req.protocol != 'https') {
            // res.set('x-forwarded-proto', 'https');
            res.redirect('https://' + host +req.url);
        } else {
            next();
        }
    });
}

router.get('/', (req, res) => {res.send({status: 'Server Started Successfully', message: 'Welcome To One Finder Backend'})});

router.post('/upload-images-to-amazons3', amazonS3.upload_images);

/** Basic Authentic Routes*/
router.post('/user/login', userController.login);
router.post('/user/signup', userController.signup);
router.post('/user/verify-phone', userController.confirmCodeRegistration);
router.post('/user/forgot-password', userController.requestForgotPassword);
router.post('/user/password/set-new-password', userController.setPasswordByPhone);
router.get('/user/api/auth/sign-in-with-token', auth.authenticate.jwt_auth, userController.getUserDetailsByToken);
// router.post('/admin/password/request-forgot-password', userController.requestForgotPasswordByEmail);
// router.post('/admin/password/set-new-password', userController.setNewPasswordByEmail);

/** Admin API */
router.post('/admin/login',userController.login);
router.post('/admin/register',userController.registerAdmin);


/** Razor Pay API */
// router.post('/user/create-razor-order-id', auth.authenticate.jwt_auth, razorPay.createOrderId);
// router.post('/user/verify-razor-payment-signature', auth.authenticate.jwt_auth, razorPay.verifySignature);

/** Company API */

router.post('/company/add-in-company', companyController.addInCompany);
router.get('/company/search-in-company', companyController.searchCompany);
router.get('/company/update-company-data', companyController.updateGeneralInfo);
router.get('/company/static-list', companyController.staticList);
router.get('/company/individual-list-details/:companyId/:country', companyController.companyIndividualList);
router.post('/company/update-company', companyController.updateCompanyData);
router.get('/company/filter-data',companyController.filterData);
router.post('/company/add-update-company-data',companyController.updateOrAddCompany);
router.post('/company/remove-company-data', companyController.removeCompany);
router.get('/company-count', companyController.countDashboard);
router.post('/company/update-company-data', companyController.updateMcaData);
router.post('/company/update-company-data-from-excel', companyController.parseExcelFile);

// Countries Info API
router.get('/countries-details', countryController.getCountriesData);

// OFAC API's
router.post('/user/add-ofac-header', ofacController.addOfacHeaders);
router.get('/user/get-meta-data-list', ofacController.getMetaDataList);
router.post('/user/add-meta-data-list', ofacController.addMetaData);
router.get('/user/search-one-check', ofacController.searchKeyword);
router.post('/user/add-ofac-data-excel-file', ofacController.readLargeFile);
router.get('/user/get-countries-name', ofacController.countryName);

// EXCEL PROCESSING
router.get('/user/meta-data-filter-excel', ofacController.meataDataFilterExcel);

// Translate Data From hindi To English
router.get('/user/translate-hindi-to-english-excel', ofacController.translateHindiToEnglish);

// MCA Company Routes
// router.post('/user/get-mca-details-from-excel', 
// auth.authenticate.jwt_auth, 
// mcaController.getMcaExcelFile, 
// mcaController.parseMcaExcelFile,
// mcaController.addIndexOfCharges,
// mcaController.getMcaDirectorExcelFile,
// mcaController.saveMcaDataToDb
// );

// MCA Company Routes
// router.post('/user/get-mca-details-from-excel', 
// auth.authenticate.jwt_auth,
// mcaController.getMcaDetails,
// mcaController.addIndexOfCharges,
// mcaController.getMcaDirectorDetails,
// mcaController.saveMcaDataToDb
// );
router.post('/user/get-mca-details-from-excel', 
auth.authenticate.jwt_auth,
newMcaController.getMcaBasicDetails,
newMcaController.filterDirectorMcaValue,
newMcaController.directorDetails,
mcaController.addIndexOfCharges,
// mcaController.getMcaDirectorDetails,
mcaController.saveMcaDataToDb
);

router.post('/user/get-mca-details', 
auth.authenticate.jwt_auth, 
mcaController.getCompanyDetails,
);

router.get('/user/get-mca-signatory-details-captcha',
auth.authenticate.jwt_auth,
mcaSignatoryController.getMcaSignatoryTokenAndSession, 
mcaSignatoryController.getMcaSignatoryCaptcha, 
mcaSignatoryController.getMcaSignatoryCaptchaDetails);

router.post('/user/get-mca-signatory-details', mcaSignatoryController.getMcaSignatoryParsedDetails);
router.post('/user/save-mca-details-from-excel', auth.authenticate.jwt_auth, mcaController.saveMcaDetailsFromExcelFile);
router.get('/user/get-mca-company-list', auth.authenticate.jwt_auth, mcaController.mcaCompanyList);
router.get('/user/get-mca-company-individual-details', auth.authenticate.jwt_auth, mcaController.mcaIndividualMcaDetails);
router.delete('/user/delete-mca-details', auth.authenticate.jwt_auth, mcaController.mcaDeleteMcaDetails);

// GST Router
router.get('/user/get-gst-captcha', gstController.getGstCookies, gstController.getGstImageCaptchaDetails);
router.post('/user/auth-gst', gstController.auth);
router.post('/user/get-all-gst-by-pan', gstController.getAllGstByPan, gstController.getSingleGstDetails);
router.get('/user/get-gst-list', auth.authenticate.jwt_auth, gstController.gstList);
router.get('/user/get-gst-individual-details', auth.authenticate.jwt_auth, gstController.gstIndividualDetails);
router.get('/user/get-gst-details', auth.authenticate.jwt_auth, gstController.gstDetails);

// GI/PI Router
router.get('/user/get-user-list', auth.authenticate.jwt_auth, gipiUserController.gipiUserList);
router.get('/user/update-user-status', auth.authenticate.jwt_auth, gipiUserController.updateGipiUserStatus);

// Empliance Check Date Router
router.post('/user/add-emp-check-date', auth.authenticate.jwt_auth, empCheckDateController.addEmpCheckDate);
router.get('/user/emp-check-date-list', auth.authenticate.jwt_auth, empCheckDateController.empCheckDateList);

// New MCA Router
router.post('/user/get-mca-basic-details', newMcaController.getMcaBasicDetails)

// Litigation BI Router
router.post('/user/get-litigation-bi/details', litigationBiController.getLitigationSearchDetails, litigationBiController.getCompanyDetailsByCin, litigationBiController.getKarzaCompanyDetails, litigationBiController.getLitigationDetails);
router.post('/user/get-litigation-bi/save/advance-excel-file', litigationBiController.getLitigationSearchDetails, litigationBiController.saveLitigationAdvancedExcelFileDetails);
router.get('/user/get/litigation-bi/list', litigationBiController.getLitigationBiListAll);
router.get('/user/get/litigation-directors/list', litigationBiController.getLitigationDirctorsListAll);
router.post('/user/get-litigation-bi/save/lite-excel-file', litigationBiController.getLitigationSearchDetails, litigationBiController.saveLitigationLiteExcelFileDetails);

// Litigation BI Director Router
router.post('/user/get-litigation-bi/save/advance-excel-file', litigationBiController.getLitigationSearchDetails, litigationBiController.saveLitigationAdvancedExcelFileDetails);

// Download mca bulk data
router.get('/user/get-mca-company-bulk/details', litigationBiController.mcaCompanyBulkData);

// AWS S3 CURD Operation Router
router.get('/user/get-bucket-object-list', awsController.listFiles)
router.post('/user/update-bucket-object', awsController.uploadFiles)
router.get('/user/generate-file-pre-signed-url', awsController.generatePresignedUrl)
router.delete('/user/delete-file', awsController.deleteFile)
router.post('/user/initiate-multipart-upload', awsController.initiateMultipartUpload)
router.post('/user/generate-presigned-urls', awsController.generateUploadPresignedUrls)
router.post('/user/complete-multipart-upload', awsController.completeMultipartUpload)

// SSE route
router.get('/events', events);
router.post('/import', (req, res, next) => {
  clearUploadsDirectory(); // Clear the uploads directory before uploading a new file
  next();
}, upload.single('file'), importExcelData);

router.post('/get-sanctions', searchData);
router.post('/get-logs', getAllLogs);
router.post('/save-log', saveLog);

//Prob Routes
router.get('/prob/getCompanyDetail/:cinOrPan', auth.authenticate.jwt_auth, probController.getCompanyDetailByCINOrPAN);


// Reseach routes
router.get('/ai-research', auth.authenticate.jwt_auth,researchController.getSearchs);
router.post('/ai-research/scrape-batch', auth.authenticate.jwt_auth,researchController.getScrappedData);
router.post('/ai-research/summarize', auth.authenticate.jwt_auth,researchController.getSummarizedArticles);

// Research Keyword routes
router.get("/search-keyword", auth.authenticate.jwt_auth, searchKeywordController.getAllKeywords);
router.get("/search-keyword/:id", auth.authenticate.jwt_auth, searchKeywordController.getKeywordById);
router.post("/search-keyword", auth.authenticate.jwt_auth, searchKeywordController.createKeyword);
router.put("/search-keyword/:id", auth.authenticate.jwt_auth, searchKeywordController.updateKeyword);
router.delete("/search-keyword/:id", auth.authenticate.jwt_auth, searchKeywordController.deleteKeyword);

// News Website routes
router.get("/news-links", auth.authenticate.jwt_auth, newsWebsiteController.getAllWebsites);
router.get("/news-links/:id", auth.authenticate.jwt_auth, newsWebsiteController.getWebsiteById);
router.post("/news-links", auth.authenticate.jwt_auth, newsWebsiteController.createWebsite);
router.put("/news-links/:id", auth.authenticate.jwt_auth, newsWebsiteController.updateWebsite);
router.delete("/news-links/:id", auth.authenticate.jwt_auth, newsWebsiteController.deleteWebsite);
/*
 * ERROR HANDLING
 */
router.use(function (req, res, next) {
  logger.error(`Requested URL not found. URL: ${req.url}`)
  //notify.log(req,'',`404 Requested URL not found. URL: ${req.url}`);
  res.status(404);
  res.render('404');
});

//TO DO: Create appropriate error handlers for client side errors
// - Check for error code and rennder appropriate error view
router.use(function (err, req, res, next) {
  logger.error(`500 Internal server error occured. Error stack: ${err.stack || err}`)
  //notify.log(req,'',err);
  res.render('500');
});


module.exports = router;
