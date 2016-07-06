/**
 * Created by seanmcgary on 7/5/16.
 */
'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const path = require('path');
const fs = Promise.promisifyAll(require('fs'));

const logwrangler = require('logwrangler');

const Content = require('./content');
const PostTypes = require('./postTypes');
const Caches = require('./cache');

class StaticContent {

	constructor(config = {}){
		this.config = _.defaults(config, {
			cache: 'memory',
			contentDir: path.resolve(__dirname)
		});

		this.logger = logwrangler.create({
			logOptions: {
				ns: 'express-static-content'
			}
		}, true);

		this.content = new Content(config, this);
		this.userAddedTypes = {};
		this.cache = new Caches.MemoryCache();
	}

	_loadContent(){
		return this.content.loadContentFromDisk();
	}

	useCache(cache){
		this.cache = cache;
	}

	getPostForType(type){
		let postType = _.find(_.values(this.userAddedTypes), (t) => t.type === type);

		if(postType){
			return postType;
		}
		postType = _.find(_.values(PostTypes), (t) => t.type === type);
		if(postType){
			return postType;
		}

		throw new Error(`invalid post type "${type}"`);
	}

	_instantiatePostFromCachedData(post){
		let type = this.getPostForType(post.config.contentType);

		return new type(post.config, post.content, this.cache);
	}

	getPostForSlug(slug){
		return this.loaded
		.then(() => {
			return this.cache.getContentBySlug(slug)
			.then((post) => this._instantiatePostFromCachedData(post));
		});
	}

	listPosts(){
		return this.loaded
		.then(() => {
			return this.cache.listPosts()
			.then((posts) => _.map(posts, (p) => this._instantiatePostFromCachedData(p)));
		});
	}

	// kick off everything and load the middleware
	middleware(options = {}){
		options = _.defaults(options, {
			postSlugParam: 'slug'
		});

		this.loaded = this._loadContent();

		return (req, res, next) => {
			let slug = req.params.slug;

			return this.getPostForSlug(slug)
			.then((post) => {
				if(post.config.status !== 'published'){
					throw new Error('not_found');
				}
				return post;
			})
			.then((post) => {
				return post.render();
			})
			.then((content) => res.send(content))
			.catch((err) => {
				this.logger.error({
					message: err.message,
					data: err
				});

				next(err);
			});
		};
	}
}



function Create(config){
	return new StaticContent(config);
}
_.each(Caches, (cache, name) => Create[name] = cache);
module.exports = Create;