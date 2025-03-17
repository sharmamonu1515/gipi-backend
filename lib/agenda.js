var config = require('../server/config');

/************* PICKUP ORDERS *************/
config.agenda.define('pickupOrderPaidNotification', {priority: 'high', concurrency: 10}, (job, done) => {
    logger.info(JSON.stringify(job.attrs));
    logger.info(done);
    //job.remove();
});

config.agenda.define('pickupOrderNoResponseOnPaidNotification', {priority: 'high', concurrency: 10}, (job, done) => {
    logger.info(JSON.stringify(job.attrs));
    logger.info(done);
    //job.remove();
});

config.agenda.define('pickupOrderNeedToBeReadyNotification', {priority: 'high', concurrency: 10}, (job, done) => {
    logger.info(JSON.stringify(job.attrs));
    logger.info(done);
    //job.remove();
});

config.agenda.define('pickupOrderNoActionNeedToBeReadyNotification', {priority: 'high', concurrency: 10}, (job, done) => {
    logger.info(JSON.stringify(job.attrs));
    logger.info(done);
    //job.remove();
});

/************* DELIVERY ORDERS *************/
config.agenda.define('deliveryOrderPaidNotification', {priority: 'high', concurrency: 10}, (job, done) => {
    logger.info(JSON.stringify(job.attrs));
    logger.info(done);
    //job.remove();
});

config.agenda.define('deliveryOrderNoResponseOnPaidNotification', {priority: 'high', concurrency: 10}, (job, done) => {
    logger.info(JSON.stringify(job.attrs));
    logger.info(done);
    //job.remove();
});

config.agenda.define('deliveryOrderNeedToBeReadyNotification', {priority: 'high', concurrency: 10}, (job, done) => {
    logger.info(JSON.stringify(job.attrs));
    logger.info(done);
    //job.remove();
});

config.agenda.define('deliveryOrderNoActionNeedToBeReadyNotification', {priority: 'high', concurrency: 10}, (job, done) => {
    logger.info(JSON.stringify(job.attrs));
    logger.info(done);
    //job.remove();
});

/************* ORDER AHEAD *************/
config.agenda.define('reservationRequestedNotification', {priority: 'high', concurrency: 10}, (job, done) => {
    logger.info(JSON.stringify(job.attrs));
    logger.info(done);
    //job.remove();
});

config.agenda.define('noResponseOnReservationRequestedNotification', {priority: 'high', concurrency: 10}, (job, done) => {
    logger.info(JSON.stringify(job.attrs));
    logger.info(done);
    //job.remove();
});

config.agenda.define('orderAheadNeedToBeReadyNotification', {priority: 'high', concurrency: 10}, (job, done) => {
    logger.info(JSON.stringify(job.attrs));
    logger.info(done);
    //job.remove();
});

config.agenda.define('orderAheadNoActionNeedToBeReadyNotification', {priority: 'high', concurrency: 10}, (job, done) => {
    logger.info(JSON.stringify(job.attrs));
    logger.info(done);
    //job.remove();
});


config.agenda.define('orderAheadNotifyOnAdvancePaymentNotification', {priority: 'high', concurrency: 10}, (job, done) => {
    logger.info(JSON.stringify(job.attrs));
    logger.info(done);
    //job.remove();
});

config.agenda.define('orderAheadNoActionOnAdvancePaymentNotification', {priority: 'high', concurrency: 10}, (job, done) => {
    logger.info(JSON.stringify(job.attrs));
    logger.info(done);
    //job.remove();
});

config.agenda.define('orderAheadCustomerInRestaurantNotification', {priority: 'high', concurrency: 10}, (job, done) => {
    logger.info(JSON.stringify(job.attrs));
    logger.info(done);
    //job.remove();
});