/**
 * Created by seanmcgary on 7/5/16.
 */
'use strict';

const express = require('express');
const path = require('path');
const StaticContent = require('../');

const app = express();

let staticContent = StaticContent({
	cache: 'redis',
	contentDir: path.resolve(`${__dirname}/content`)
});

staticContent.useCache(new StaticContent.RedisCache());

app.get('/posts/:slug', staticContent.middleware());

app.listen(9999, () => {
	console.log('running on port 9090');
});