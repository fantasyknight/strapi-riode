'use strict';

const { findPosts, removePrivateData } = require( '../services/blogs' );

module.exports = {
    async getPosts( ctx ) {
        let { demo } = ctx.params;
        let from = ctx.query.from ? ctx.query.from : 0;
        let to = ctx.query.to ? ctx.query.to : 6;

        demo = demo.replace( /demo| |-/gi, '' );

        let demoPosts1 = findPosts( { "demo": "element" }, [ "video", "large_pictures", "pictures", "small_pictures", "blog_categories" ] );
        let demoPosts2 = findPosts( { "demo": demo }, [ "video", "large_pictures", "pictures", "small_pictures", "blog_categories" ] );
        let posts = [];

        await demoPosts1.then( data => { data.forEach( item => posts.push( removePrivateData( item ) ) ) } )
        await demoPosts2.then( data => { data.forEach( item => posts.push( removePrivateData( item ) ) ) } )

        var counts = {};
        if ( ctx.query.filter_list ) {
            let categories = ctx.query.filter_list.split( ',' );
            categories.forEach( category => counts[ category ] = posts.filter( post => post.blog_categories.find( cat => cat.slug === category || category === 'all' ) ).length );
        }

        ctx.query.search && ( posts = posts.filter( post => post.title.toLowerCase().includes( ctx.query.search ) ) );
        ctx.query.category && ( posts = posts.filter( post => post.blog_categories.find( cat => cat.slug === ctx.query.category || ctx.query.category === 'all' ) ) );

        return {
            data: posts.slice( from, to ),
            total: posts.length,
            counts: counts
        }
    },
    async getPost( ctx ) {
        let demo = ctx.params.demo;
        let post = {}, result = {};
        let limit = ctx.query.limit ? parseInt( ctx.query.limit ) : 5;

        demo = demo.replace( /demo| |-/gi, '' );

        let singlePost = findPosts( { "slug": ctx.params.slug }, [ "video", "large_pictures", "pictures", "small_pictures", "blog_categories" ] );
        let demoPosts1 = findPosts( { "demo": "element" }, [ "video", "large_pictures", "pictures", "small_pictures", "blog_categories" ] );
        let demoPosts2 = findPosts( { "demo": demo }, [ "video", "large_pictures", "pictures", "small_pictures", "blog_categories" ] );
        let posts = [];

        await demoPosts1.then( data => { data.forEach( item => posts.push( removePrivateData( item ) ) ) } )
        await demoPosts2.then( data => { data.forEach( item => posts.push( removePrivateData( item ) ) ) } )
        await singlePost.then( data => { data.forEach( item => post = removePrivateData( item ) ) } );
        result = { ...result, data: post };

        let related = posts.filter( item => item.slug !== ctx.params.slug && item.blog_categories.find( cat => post.blog_categories.find( compareCat => compareCat.slug === cat.slug ) ) );
        result = { ...result, related: related.slice( 0, limit ) };

        let index = posts.findIndex( item => item.slug === ctx.params.slug );
        result = { ...result, prev: posts[ Math.max( 0, index - 1 ) ], next: posts[ Math.min( posts.length - 1, index + 1 ) ] };

        return result;
    },
    async getSidebarData( ctx ) {
        let demo = ctx.params.demo;
        demo = demo.replace( /demo| |-/gi, '' );

        let demoPosts1 = findPosts( { "demo": "element" }, [ "video", "large_pictures", "pictures", "small_pictures", "blog_categories" ] );
        let demoPosts2 = findPosts( { "demo": demo }, [ "video", "large_pictures", "pictures", "small_pictures", "blog_categories" ] );
        let posts = [];

        await demoPosts1.then( data => { data.forEach( item => posts.push( removePrivateData( item ) ) ) } )
        await demoPosts2.then( data => { data.forEach( item => posts.push( removePrivateData( item ) ) ) } )

        posts = posts.sort( ( itemA, itemB ) => new Date( itemA.date ) > new Date( itemB.date ) ).slice( 0, 3 )

        return {
            recent: posts
        }
    }
};
