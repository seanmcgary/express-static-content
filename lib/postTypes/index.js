/**
 * Created by seanmcgary on 7/5/16.
 */
'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const marked = require('marked');

marked.setOptions({
	renderer: new marked.Renderer(),
	gfm: true,
	tables: true,
	breaks: true,
	pedantic: false,
	smartLists: true,
	smartypants: true
});

class Post {
	constructor(config, content, cache){
		this.config = config;
		this.content = content;
		this.cache = cache;

		if(!this.config.title){
			throw new Error('title is required');
		}

		if(!this.config.slug){
			this.config.slug = this._slugify(this.config.title);
		}
	}

	_slugify(str = ''){
		str = str || '';
		return _.kebabCase((str || '')
			.toLowerCase()
			.replace(/[^a-zA-Z0-9_-]/gi, ''));
	}

	saveContent(){
		let payload = {
			config: this.config,
			content: this.content
		};
		return this.cache.set(this.config.slug, payload);
	}

	render(){
		return this.content;
	}
}

class MarkdownPost extends Post {

	constructor(config, content, cache){
		super(config, content, cache);
	}

	render(){
		return new Promise((resolve, reject) => {
			resolve(marked(this.content));
		});
	}
}
MarkdownPost.type = 'markdown';

class HTMLPost extends Post {

	constructor(config, content, cache){
		super(config, content, cache);
	}

	render(){

	}
}
HTMLPost.type = 'html';

module.exports = {
	Post,
	MarkdownPost,
	HTMLPost
};
