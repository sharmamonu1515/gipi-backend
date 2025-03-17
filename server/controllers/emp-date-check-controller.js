const empCheck = module.exports;
const EmpCheckDate = require('../models/gst_empliance_check_date');

// Add Empliance Check Date
empCheck.addEmpCheckDate = async function addEmpCheckDate(req, res) {
    try {

        if (
            !req.body.dateData
        )
            return res.status(500).send({
                status: 'error',
                message: 'Missing Required Fields'
            });

        let checkBodyDateType = ['GSTR1', 'GSTR6', 'GSTR3B', 'GSTR9', 'GSTR9C', 'GSTR10', 'GSTR7', 'GSTR8'];
        let requestBodyDateType = req.body.dateData.map((items) => items.columnName);
        let checkResult = checkBodyDateType.sort().toString() == requestBodyDateType.sort().toString();

        if (!checkResult)
            return res.status(500).send({
                status: 'error',
                message: 'Missing Required Objects Key.'
            });

        let saveData = {
            emplianceCheckDate: {}
        };

        for (let item of req.body.dateData) {
            saveData['emplianceCheckDate'][item.columnName] = {};
            for (let cell of item.cells) {
                saveData['emplianceCheckDate'][item.columnName][cell.month] = cell.date;
            }
        }

        let foundEmpCheckDate = await EmpCheckDate.findOne({});

        if (!foundEmpCheckDate) {

            let data = saveData;
            data.createdBy = req.body.jwtInfo.jwtId;
            let emplianceCheckData = new EmpCheckDate(data);
            let savedData = await emplianceCheckData.save();

            return res.status(200).send({
                status: 'success',
                message: 'Empliance Check Date Added Successfully.',
                data: {
                    _id: savedData._id
                }
            });

        } else {

            let data = saveData;
            data.updatedAt = Date.now();
            data.updatedBy = req.body.jwtInfo.jwtId;

            let updatedEmpCheck = await EmpCheckDate.findByIdAndUpdate(foundEmpCheckDate._id, data, { new: true });

            return res.status(200).send({
                status: 'success',
                message: 'Empliance Check Date Updated Successfully.',
                data: {
                    _id: updatedEmpCheck._id
                }
            });

        }

    } catch (error) {
        return res.status(500).send(error.message);
    }
}

//List Empliance Check Date
empCheck.empCheckDateList = async function empCheckDateList(req, res) {
    try {

        let foundEmpCheckDate = await EmpCheckDate.findOne({});

        if (new Date().getMonth() + 1 === 4) {

            let getAgainstFin = `${new Date().getFullYear() - 2}-${new Date().getFullYear() - 1}`;
            let checkAgainstFinQuery = {};
            checkAgainstFinQuery[`emplianceCheckDate.GSTR9.${getAgainstFin}`] = { $exists: true }
            let checkAgainstFin = await EmpCheckDate.findOne(checkAgainstFinQuery)

            if (!checkAgainstFin) {
                let previousObject = foundEmpCheckDate.emplianceCheckDate;

                let gstr9Obj = foundEmpCheckDate.emplianceCheckDate["GSTR9"];
                let gstr9CObj = foundEmpCheckDate.emplianceCheckDate["GSTR9C"];
                let gstr10Obj = foundEmpCheckDate.emplianceCheckDate["GSTR10"];
                let dateValue = `${(new Date().getDate()).toString().padStart(2, '0')}/${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${new Date().getFullYear()}`;

                gstr9Obj = { [getAgainstFin]: dateValue, ...gstr9Obj };
                gstr9CObj = { [getAgainstFin]: dateValue, ...gstr9CObj };
                gstr10Obj = { [getAgainstFin]: dateValue, ...gstr10Obj };

                previousObject["GSTR9"] = gstr9Obj;
                previousObject["GSTR9C"] = gstr9CObj;
                previousObject["GSTR10"] = gstr10Obj;

                foundEmpCheckDate = await EmpCheckDate.findOneAndUpdate({}, {
                    emplianceCheckDate: previousObject
                }, { new: true });

            }

        }

        if (!foundEmpCheckDate)
            return res.status(500).send({
                status: 'error',
                message: 'Record Not Found.'
            });

        return res.status(200).send({
            status: 'success',
            message: 'Empliance Check Date Fetched Successfully.',
            data: foundEmpCheckDate
        });


    } catch (error) {
        return res.status(500).send(error.message);
    }
}
