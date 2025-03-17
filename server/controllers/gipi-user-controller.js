const gipiUser = module.exports;
const GiPiUser = require('../models/user');

// GIPI User All List
gipiUser.gipiUserList = async function gipiUserList(req, res) {
    try {

        if (
            !req.query.sort ||
            !req.query.order ||
            !req.query.page
        )
            return res.status(500).send('Missing requried fields');

        let sort = {}, limit = 30;
        req.query.order === 'desc' ? sort[req.query.sort] = -1 : sort[req.query.sort] = 1;
        let skip = limit * (Number(req.query.page) - 1);

        let query = {
            'profile.permissionGroups': { $in: ['user'] }
        }

        let total_count = await GiPiUser.countDocuments(query);

        let gipiUserDetails = await GiPiUser.aggregate([
            {
                $match: query
            },
            { $sort: sort },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    username: '$local.userName',
                    email: '$local.email',
                    name: { $concat: ['$profile.contactInfo.firstName', ' ', '$profile.contactInfo.lastName'] },
                    isActive: 1,
                    createdAt: '$metaData.createdAt',
                    permission: { $arrayElemAt: ['$profile.permissionGroups', 0] }
                }
            }
        ]);

        return res.status(200).send({
            items: gipiUserDetails,
            total_count: total_count
        });

    } catch (error) {
        return res.status(500).send(error.message);
    }
}

gipiUser.updateGipiUserStatus = async function updateGipiUserStatus(req, res) {
    try {

        if (
            !req.query.userId ||
            !req.query.checked
        )
            return res.status(500).send('Missing requried fields');

        let userDetails = await GiPiUser.findById(req.query.userId);

        if (!userDetails)
            return res.status(500).send('User Not Exists');

        await GiPiUser.findByIdAndUpdate(req.query.userId, {
            isActive: req.query.checked,
            'metaData.updatedAt': Date.now()
        });

        return res.status(200).send({
            message: 'User Status Updated Successfully',
            action: true
        });

    } catch (error) {
        return res.status(500).send(error.message);
    }
}