/**
 * yaraguwa (屋良小)
 * https://github.com/paazmaya/yaraguwa
 *
 * Check the health of GitHub repositories and visualise it with D3.js
 *
 * Copyright (c) Juga Paazmaya <paazmaya@yahoo.com> (https://paazmaya.fi)
 * Licensed under the MIT license
 */
'use strict';

const fs = require('fs'),
  querystring = require('querystring');

const got = require('got');

const pkg = require('./package.json');

const GITHUB_API = 'https://api.github.com',
  USER_AGENT = `${pkg.name}/${pkg.version}`;

/**
 * Parse the assumed JSON data, such as incoming GitHub API response,
 * that should be always JSON.
 *
 * @param {string} input String data, that should be valid JSON
 * @return {Object} Parsed data
 * @see https://developer.github.com/v3/#schema
 */
const parseJson = (input) => {
  let data = {};

  try {
    data = JSON.parse(input);
  }
  catch (error) {
    console.error('Could not parse JSON input');
    console.error(error);
  }
  return data;
};

/**
 * Get the list of issues from GitHub API, split them to two lists:
 * issues and pull requests.
 *
 * @param  {Array} list List of issues
 * @return {Object} Issues and pull requests separated
 */
const splitIssuesPullRequests = (list) => {
  const data = {};
  data.issues = list.filter(item => !item.pull_request);
  data.pullrequests = list.filter(item => item.pull_request);
  return data;
};

/**
 * Get a list of issues for the given repository.
 *
 * @param {string} fullName GitHub username/reponame
 * @param {string} token GitHub API personal token
 * @return {Promise}
 * @see https://developer.github.com/v3/issues/#list-issues-for-a-repository
 */
const getIssues = (data, token) => {
  const params = {
    state: 'open',
    sort: 'created',
    direction: 'desc',
    per_page: 40,
    page: 1
  };

  const query = querystring.stringify(params);
  const url = `${GITHUB_API}/repos/${data.full_name}/issues?${query}`;

  return got(url, {
    json: true,
    headers: {
      //'accept': 'application/vnd.github.v3+json',

      // https://developer.github.com/changes/2016-05-12-reactions-api-preview/
      'accept': 'application/vnd.github.squirrel-girl-preview',

      'authorization': `token ${token}`,
      'user-agent': USER_AGENT
    },
    method: 'GET'
  }).then(response => {
    console.log('url', url);
    console.log(response.statusCode);
    fs.writeFileSync(`issues-${data.name}.json`, JSON.stringify({issues: response.body}, null, '  '), 'utf8');

    if (Object.prototype.hasOwnProperty.call(response.headers, 'link')) {
      // there are more pages
      console.log(response.headers.link);
    }

    const issues = splitIssuesPullRequests(response.body);
    data.issues = issues.issues;
    data.pullrequests = issues.pullrequests;
    return data;
  }).catch(error => {
    console.error('Some issues with the GitHub API call');
    console.error(error);
  });
};

/**
 * Get a list of repositories of the given user.
 *
 * @param {string} username GitHub username
 * @param {string} token GitHub API personal token
 * @return {Promise}
 * @see https://developer.github.com/v3/repos/#list-user-repositories
 */
const getRepositories = (username, token) => {
  const params = {
    type: 'all',
    sort: 'full_name',
    direction: 'asc',
    per_page: 40,
    page: 1
  };

  const query = querystring.stringify(params);
  const url = `${GITHUB_API}/users/${username}/repos?${query}`;

  return got(url, {
    json: true,
    headers: {
      'accept': 'application/vnd.github.v3+json',
      'authorization': `token ${token}`,
      'user-agent': USER_AGENT
    },
    method: 'GET'
  }).then(response => {
    console.log('url', url);
    console.log(response.statusCode);
    fs.writeFileSync(`repos-${username}-${params.type}-${params.page}.json`, JSON.stringify({repos: response.body}, null, '  '), 'utf8');

    if (Object.prototype.hasOwnProperty.call(response.headers, 'link')) {
      // there are more pages
      console.log(response.headers.link);
    }

    return response.body;
  }).catch(error => {
    console.error('Some issues with the GitHub API call');
    console.error(error);
  });
};

/**
 * @param {Object} options Options for the module
 * @param {string} options.token GitHub API personal token
 * @param {string} options.username GitHub username
 * @return {Promise}
 */
module.exports = function (options) {
  console.log(options);

  // options.token for GitHub API
  return getRepositories(options.username, options.token)
    .then(list => {
      return list.map(item => {
        return getIssues(item, options.token);
      });
    })
    .then(list => {
      return Promise.all(list);
    })
    .then(list => {
      console.log('Have all completed now and does the list contain all issues?');
      console.log('list.length', list.length);
      fs.writeFileSync(`repos-${options.username}.json`, JSON.stringify({data: list}, null, '  '), 'utf8');

    })
    .catch((error) => {
      console.error('There seem to have been errors');
      console.error(error);
    });
};
