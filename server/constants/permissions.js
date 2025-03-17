'use strict';

const GROUP_PERMISSIONS = {
  USER: 'user',
  ADMIN : 'admin',
  ONLINEDOCTORS : 'onlineDoctors',
  SAASPRODUCT: 'saasProduct',
  GIPIADMIN: 'gipiAdmin',
};

const GROUP_CATEGORIES = {
  category1: ['admin'],
  category2: ['user'],
  category3: ['user', 'admin']
}

module.exports = {
  GROUP_PERMISSIONS: GROUP_PERMISSIONS,
  GROUP_CATEGORIES: GROUP_CATEGORIES
};
