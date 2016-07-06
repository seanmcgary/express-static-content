/**
 * Created by seanmcgary on 7/5/16.
 */
'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const Redis = require('ioredis');
const logwrangler = require('logwrangler');


class Cache {
	constructor(config = {}){

	}

	saveContent(){
		throw new Error('cache::saveContent - implementation required');
	}

	getContentBySlug(){
		throw new Error('cache::getContentBySlug - implementation required');
	}
}

class MemoryCache extends Cache {
	constructor(config){
		super(config);

		this.store = new Map();
	}

	set(key, data){
		return new Promise((resolve, reject) => {
			this.store.set(key, data);
		});
	}

	getContentBySlug(slug){
		return new Promise((resolve, reject) => {
			let content = this.store.get(slug);

			if(!content){
				return reject(new Error('not_found'));
			}

			return resolve(content);
		});
	}
}

class RedisCache extends Cache {
	constructor(config){
		super(config);

		this.config = config = _.defaults(config, {
			host: '127.0.0.1',
			port: '6379'
		});
		this.logger = logwrangler.create({
			logOptions: {
				ns: 'RedisCache'
			}
		});

		this.redis = new Redis(config.port, config.host, config.options || {});
		this.redis.on('connect', () => {
			this.logger.info({ message: 'connected to cache' });
		});

		this.redis.on('disconnect', () => {
			this.logger.warn({ message: 'disconnected from cache' });
		});
	}

	set(key, data){
		return this.redis.set(key, JSON.stringify(data))
		.then(() => {
			this.logger.info({
				message: `setting post "${key}`
			});
		});
	}

	getContentBySlug(slug){
		return this.redis.get(slug)
		.then((data) => {
			if(!data){
				throw new Error('not_found');
			}

			return JSON.parse(data);
		});
	}
}

module.exports = {
	Cache,
	MemoryCache,
	RedisCache
};