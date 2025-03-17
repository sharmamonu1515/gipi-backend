// const razorPay = require('../../lib/razorpay');
// const ApiUtility = require('../../lib/api-utility');
// const razor = module.exports;
// const User = require('../models/user');
// const { ObjectID } = require('mongodb');
// const RazorOrder = require('../models/razor-order-id');
// const allowForRequest = require('../../utils/common-utilities');
// const Appointment = require('../models/set-appointment');
// const util = require('../../utils/common-utilities');

// razor.createOrderId = async function createOrderId (req, res) { // Create Order Id
//     try {
        
//         if(!req.body.doctorId)
//         return res.send(ApiUtility.failed('Missing Requried Fields'));

//         if(!allowForRequest.allowForAction(req.body.jwtInfo.permission, 'category2'))
//         return res.send(ApiUtility.failed('You have no permission to make this request'));

//         let userExist = await User.findById({_id: ObjectID(req.body.jwtInfo.jwtId)});
//         let doctorDetails = await User.findById({_id: ObjectID(req.body.doctorId)});

//         if(!userExist)
//             return res.send(ApiUtility.failed('User not Authenticated'));
        
//         if(!doctorDetails)
//             return res.send(ApiUtility.failed('Doctor not Authenticated'));

//         if(doctorDetails.doctorProfile.pricingType === "Free") {

//             let order = {
//                 notes: [],
//                 entity: 'order',
//                 amount: 0,
//                 amount_paid: 0,
//                 amount_due: 0,
//                 currency: 'INR',
//                 receipt: `tela_${Date.now()}`,
//                 offer_id: null,
//                 attempts: 0,
//                 freeConsultation: true
//             }
//             order.providerId = doctorDetails._id,
//             order.userId = userExist._id;
//             order.firstName = userExist.profile.contactInfo.firstName ? 
//             userExist.profile.contactInfo.firstName : '';
//             order.lastName = userExist.profile.contactInfo.lastName ? 
//             userExist.profile.contactInfo.lastName : '';
//             order.phone = userExist.profile.contactInfo.phone ? 
//             userExist.profile.contactInfo.phone : '';
//             order.email = userExist.notifyEmail ? 
//             userExist.notifyEmail: null;

//             let savedOrder = await RazorOrder.createOrderId(order);
//             order.razorDbId = savedOrder._id;
//             return res.send(ApiUtility.success(order,'Order Id Created Successfully'));            

//         } else {

//         if(
//             !req.body.amount ||
//             !req.body.currency
//         )
//         return res.send(ApiUtility.failed('Missing Required Fields'));

//         if(isNaN(req.body.amount))
//         return res.send(ApiUtility.failed('Amount is Invalid'));
        
//         return razorPay.generateOrderId(req.body).then(async(order) => {
//             order.userId = userExist._id;
//             order.firstName = userExist.profile.contactInfo.firstName ? 
//             userExist.profile.contactInfo.firstName : '';
//             order.lastName = userExist.profile.contactInfo.lastName ? 
//             userExist.profile.contactInfo.lastName : '';
//             order.phone = userExist.profile.contactInfo.phone ? 
//             userExist.profile.contactInfo.phone : '';
//             order.email = userExist.notifyEmail ? 
//             userExist.notifyEmail: null;

//             let savedOrder = await RazorOrder.createOrderId(order);
//             order.razorDbId = savedOrder._id;
//             return res.send(ApiUtility.success(order,'Order Id Created Successfully'));

//         }).catch((err) => {
//             return res.send(ApiUtility.failed(err.message));
//         })
//     }         

//     } catch (error) {
//         return res.send({status: 'error', message: error.message});
//     }
// }

// razor.verifySignature = async function verifySignature(req, res) {
//     try {
//         console.log(req.body);

//         if(!allowForRequest.allowForAction(req.body.jwtInfo.permission, 'category2'))
//         return res.send(ApiUtility.failed('You have no permission to make this request'));

//         if(req.body.sessionValue.amount > 0) {

//             if(
//                 !req.body.razorOrderId ||
//                 !req.body.razorPayId ||
//                 !req.body.razorSignature
//             )
//             return res.send(ApiUtility.failed('Missing Required Fields'));

//         let isSignatureValid = await razorPay.verifyPaymentSignature(req.body);
//         if(isSignatureValid) {

//             await RazorOrder.findOneAndUpdate({id: req.body.razorOrderId}, { // Complete Order Payment
//                 'paymentDetails.payId': req.body.razorPayId,
//                 'paymentDetails.razorSignature': req.body.razorSignature,
//                 'paymentDetails.isPaymentDone': true,
//                 'paymentDetails.paymentDoneDate': Date.now(),
//             });

//             let appointmentObject = {
//                 appointmentType: 'online',
//                 appointmentDate: req.body.sessionValue.slotVlaue.slotDate,
//                 appointmentTime: req.body.sessionValue.slotVlaue.timeslot,
//                 razorPayDbId: req.body.sessionValue.razorDbId,
//                 userId: req.body.sessionValue.userId,
//                 doctorId: req.body.sessionValue.doctorId,
//             }
            
//             let startDate = new Date(appointmentObject.appointmentDate);
//             startDate.setHours(util.getTime(appointmentObject.appointmentTime.substr(0, appointmentObject.appointmentTime.indexOf('-') - 1)));
            
//             let endDate = new Date(appointmentObject.appointmentDate);
//             endDate.setHours( util.getTime(appointmentObject.appointmentTime.substr(appointmentObject.appointmentTime.indexOf('-') + 2)) );

//             appointmentObject.slotStartDateAndTime = startDate;
//             appointmentObject.slotEndDateAndTime = endDate;

//             await Appointment.addClinicAppointment(appointmentObject);
//             await User.findByIdAndUpdate({_id: ObjectID(req.body.sessionValue.userId)}, {
//                 notifyEmail: req.body.sessionValue.email
//             })
//         }

//         return res.send(ApiUtility.success({data: isSignatureValid}, 'Payment Done Successfully'));

//         } else {
//             console.log('pou')
//             let appointmentObject = {
//                 appointmentType: 'online',
//                 appointmentDate: req.body.sessionValue.slotVlaue.slotDate,
//                 appointmentTime: req.body.sessionValue.slotVlaue.timeslot,
//                 razorPayDbId: req.body.sessionValue.razorDbId,
//                 userId: req.body.sessionValue.userId,
//                 doctorId: req.body.sessionValue.doctorId,
//             }
            
//             let startDate = new Date(appointmentObject.appointmentDate);
//             startDate.setHours(util.getTime(appointmentObject.appointmentTime.substr(0, appointmentObject.appointmentTime.indexOf('-') - 1)));
            
//             let endDate = new Date(appointmentObject.appointmentDate);
//             endDate.setHours( util.getTime(appointmentObject.appointmentTime.substr(appointmentObject.appointmentTime.indexOf('-') + 2)) );

//             appointmentObject.slotStartDateAndTime = startDate;
//             appointmentObject.slotEndDateAndTime = endDate;

//             await Appointment.addClinicAppointment(appointmentObject);
//             await User.findByIdAndUpdate({_id: ObjectID(req.body.sessionValue.userId)}, {
//                 notifyEmail: req.body.sessionValue.email
//             });
            
//             return res.send(ApiUtility.success({data: true}, 'Payment Done Successfully'));
            

//         }

        
        
//     } catch (error) {
//         return res.send({status: 'error', message: error.message});
//     }
// }