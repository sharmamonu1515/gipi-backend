'use strict';

module.exports = {
    success: (data, message = 'success') => {
        return {
            "status": 'success',
            "message": message,
            "data": data
        }
    },
    failed: (message = 'error', data = [], error_code = null) => {
        return {
            "status": 'error',
            "message": message,
            "error_code": error_code
        }
    }
}