/**
 * Created by seanmcgary on 7/5/16.
 */
'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const path = require('path');
const fs = Promise.promisifyAll(require('fs'));


class Content {
	constructor(config = {}, staticContent){
		if(!config.contentDir){
			throw new Error('please provide a content directory');
		}

		this.config = config;
		this.staticContent = staticContent;
	}

	loadContentFromDisk(){
		return fs.readdirAsync(this.config.contentDir)
		.then((posts) => {
			return Promise.map(posts, (post) => {
				let postPath = `${this.config.contentDir}/${post}`;
				return fs.lstatAsync(postPath)
				.then((stats) => {
					if(!stats.isDirectory()){
						return null;
					}

					let config = require(`${postPath}/post.json`);

					let postType = this.staticContent.getPostForType(config.contentType);

					return fs.readFileAsync(`${postPath}/${config.contentName}`)
					.then((content) => content.toString())
					.then((content) => {
						let post = new postType(config, content, this.staticContent.cache);

						return post.saveContent();
					});
				});
			}, { concurrency: 5 });
		});
	}
}

module.exports = Content;