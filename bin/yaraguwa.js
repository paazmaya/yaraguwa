#!/bin/env node

/**
 * yaraguwa (屋良小)
 * https://github.com/paazmaya/yaraguwa
 *
 * Check the health of GitHub repositories and visualise it with D3.js
 *
 * Copyright (c) Juga Paazmaya <paazmaya@yahoo.com> (https://paazmaya.fi)
 * Licensed under the MIT license
 */

const yaraguwa = require('../index');

const options = {
  token: process.env.GITHUB_TOKEN || '',
  username: 'paazmaya'
};

yaraguwa(options);
