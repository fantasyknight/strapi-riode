'use strict';

const { findProducts, findPosts, findCategories, getMinMaxPrice, getDiscount, isSaleProduct, removePrivateData } = require( '../services/products' );

module.exports = {
    async getHomeData( ctx ) {
        let { demo } = ctx.params;
        let limit = ctx.query.limit ? parseInt( ctx.query.limit ) : 7;
        let is_product = ctx.query.is_product === "true" ? true : false;
        let is_post = ctx.query.is_post === "true" ? true : false;
        let results = {};

        demo = demo.replace( /demo| |-/gi, '' );

        /** Get Products */
        let demoProducts = findProducts( { "demo": demo }, [ 'large_pictures', 'pictures', 'small_pictures', 'product_categories', 'tags', 'brands' ] )
        let products = [];

        await demoProducts.then( data => { data.forEach( item => products.push( removePrivateData( item ) ) ) } )
        products = products.map( product => { return { ...product, display_price: getMinMaxPrice( product ), discount: Math.round( getDiscount( product ) ) } } )
        is_product && ( results = { ...results, products: products.slice( 0, limit ) } );
        ctx.query.featured === "true" && ( results = { ...results, featured: products.filter( item => item.is_featured ).slice( 0, limit ) } );
        ctx.query.best_selling === "true" && ( results = { ...results, bestSelling: products.sort( ( itemA, itemB ) => itemB.sale_count - itemA.sale_count ).slice( 0, limit ) } );
        ctx.query.top_rated === "true" && ( results = { ...results, topRated: products.sort( ( itemA, itemB ) => itemB.ratings - itemA.ratings ).slice( 0, limit ) } );
        ctx.query.latest === "true" && ( results = { ...results, latest: products.filter( item => item.is_new ).slice( 0, limit ) } );
        ctx.query.on_sale === "true" && ( results = { ...results, onSale: products.filter( item => isSaleProduct( item ) ).slice( 0, limit ) } );
        ctx.query.is_deal === "true" && ( results = { ...results, deal: products.filter( item => item.until ).slice( 0, limit ) } );

        if ( ctx.query.category ) {
            let demoCategories = findCategories( { "demo": demo }, [ 'children' ] );
            let categories = [];
            await demoCategories.then( data => { data.forEach( item => categories.push( item ) ) } );
            categories = categories.sort( ( itemA, itemB ) => itemA.depth - itemB.depth );

            let categoryFilters = ctx.query.category.split( ',' );

            categoryFilters.forEach( ( categoryFilter, index ) => {
                let catSlugs = [], flag = true, start = 0;
                catSlugs.push( categoryFilter );

                while ( flag ) {
                    let nextStart = catSlugs.length;
                    for ( let i = start; i < catSlugs.length; i++ ) {
                        let category = categories.find( cat => cat.slug === catSlugs[ i ] )
                        if ( category && category.children.length > 0 ) {
                            category.children.forEach( item => catSlugs.push( item.slug ) );
                        }
                    }
                    nextStart === catSlugs.length ? flag = false : start = nextStart;
                }
                results[ `category${ index + 1 }` ] = products.filter( item => {
                    if ( catSlugs.length > 0 ) {
                        let catFlag = false;
                        catSlugs.forEach( cat => {
                            if ( item.product_categories.findIndex( itemCat => itemCat.slug === cat || cat === 'all' ) > -1 ) {
                                catFlag = true;
                            }
                        } )
                        return catFlag;
                    }
                } ).slice( 0, limit )
            } )
        }
        var counts = {};
        if ( ctx.query.category_list ) {
            let categories = ctx.query.category_list.split( ',' );
            categories.forEach( category => counts[ category ] = products.filter( product => product.product_categories.find( cat => cat.slug === category || category === 'all' ) ).length );
            results = { ...results, counts: counts }
        }

        /** Get Posts */
        let demoPosts = findPosts( { "demo": demo }, [ 'video', 'large_pictures', 'pictures', 'small_pictures', 'blog_categories' ] )
        let posts = [];

        await demoPosts.then( data => { data.forEach( item => posts.push( removePrivateData( item ) ) ) } )
        is_post && ( results = { ...results, posts: posts.slice( 0, limit ) } );

        return results;
    },
    async getProduct( ctx ) {
        let { demo, slug } = ctx.params;
        let limit = ctx.query.limit ? parseInt( ctx.query.limit ) : 6;
        let onlyData = ctx.query.only_data === "true" ? true : false;
        let result = {}

        demo = demo.replace( /demo| |-/gi, '' );

        let demoProducts = findProducts( { "demo": demo }, [ 'large_pictures', 'pictures', 'small_pictures', 'product_categories', 'tags', 'brands' ] )
        let products = [];

        await demoProducts.then( data => { data.forEach( item => products.push( removePrivateData( item ) ) ) } )
        products = products.map( product => { return { ...product, display_price: getMinMaxPrice( product ), discount: Math.round( getDiscount( product ) ) } } )

        const product = products.find( product => product.slug === slug );
        result = { ...result, data: product }

        if ( onlyData === false ) {
            let related = products.filter( item => {
                let flag = false;
                item.product_categories.forEach( cat => {
                    if ( product.product_categories.find( compareCat => compareCat.slug === cat.slug ) ) {
                        flag = true;
                    }
                } )
                return flag;
            } )

            let index = related.findIndex( item => item.slug === product.slug );
            result = { ...result, prev: index > 0 ? related[ index - 1 ] : null, next: index < related.length - 1 ? related[ index + 1 ] : null, related: related.filter( item => item.slug !== product.slug ).slice( 0, limit ) };
        }

        return result;
    },
    async getProducts( ctx ) {
        let { demo } = ctx.params;
        let from = ctx.query.from ? ctx.query.from : 0;
        let to = ctx.query.to ? ctx.query.to : 12;

        demo = demo.replace( /demo| |-/gi, '' );

        let demoProducts = findProducts( { "demo": demo }, [ 'large_pictures', 'pictures', 'small_pictures', 'product_categories', 'tags', 'brands' ] );
        let products = [];
        await demoProducts.then( data => { data.forEach( item => products.push( removePrivateData( item ) ) ) } )
        products = products.map( product => { return { ...product, display_price: getMinMaxPrice( product ), discount: Math.round( getDiscount( product ) ) } } );

        let demoCategories = findCategories( { "demo": demo }, [ 'children' ] );
        let categories = [], catSlugs = [];
        await demoCategories.then( data => { data.forEach( item => categories.push( item ) ) } );
        categories = categories.sort( ( itemA, itemB ) => itemA.depth - itemB.depth );

        if ( ctx.query.category ) {
            let flag = true, start = 0;
            catSlugs.push( ctx.query.category );

            while ( flag ) {
                let nextStart = catSlugs.length;
                for ( let i = start; i < catSlugs.length; i++ ) {
                    let category = categories.find( cat => cat.slug === catSlugs[ i ] )
                    if ( category && category.children.length > 0 ) {
                        category.children.forEach( item => catSlugs.push( item.slug ) );
                    }
                }
                nextStart === catSlugs.length ? flag = false : start = nextStart;
            }
        }

        products = products.filter( item => {
            let flag = true;

            if ( ctx.query.search ) {
                flag = item.name.toLowerCase().includes( ctx.query.search.toLowerCase() );
            }

            if ( flag && catSlugs.length > 0 ) {
                let catFlag = false;
                catSlugs.forEach( cat => {
                    if ( item.product_categories.findIndex( itemCat => itemCat.slug === cat || cat === 'all' ) > -1 ) {
                        catFlag = true;
                    }
                } )
                flag = catFlag;
            }

            if ( flag && ctx.query.tag ) {
                flag = item.tags.find( tag => tag.slug === ctx.query.tag )
            }

            if ( flag && ( ctx.query.colors || ctx.query.sizes ) ) {
                let sizes = [], colors = [];
                sizes = ctx.query.sizes ? ctx.query.sizes.split( ',' ) : [];
                colors = ctx.query.colors ? ctx.query.colors.split( ',' ) : [];
                flag = item.variants.find( variant => {
                    return ( !colors.length || ( variant.color && colors.findIndex( color => color === variant.color.slug ) > -1 ) ) &&
                        ( !sizes.length || ( variant.size && sizes.findIndex( size => size === variant.size.slug ) > -1 ) )
                } );
            }

            if ( flag && ctx.query.brands ) {
                let brands = [];
                brands = ctx.query.brands ? ctx.query.brands.split( ',' ) : [];
                flag = item.brands.find( brand => { return brands.findIndex( slug => slug === brand.slug ) > -1 } );
            }

            if ( flag && ( ctx.query.min_price !== undefined || ctx.query.max_price !== undefined ) ) {
                let minPrice = ctx.query.min_price === undefined ? 0 : ctx.query.min_price;
                let maxPrice = ctx.query.max_price === undefined ? 1000000 : ctx.query.max_price;
                flag = item.display_price[ 0 ] >= minPrice && item.display_price[ 0 ] <= maxPrice;
            }

            if ( flag && ctx.query.ratings ) {
                flag = item.ratings === parseInt( ctx.query.ratings ) ? true : false;
            }

            return flag;
        } )

        switch ( ctx.query.sort_by ) {
            case 'popularity':
                products = products.sort( ( a, b ) => b.sale_count - a.sale_count );
                break;
            case 'rating':
                products = products.sort( ( a, b ) => b.ratings - a.ratings );
                break;
            case 'price-high':
                products = products.sort( ( a, b ) => a.display_price[ 0 ] - b.display_price[ 0 ] );
                break;
            case 'price-low':
                products = products.sort( ( a, b ) => b.display_price[ 0 ] - a.display_price[ 0 ] );
                break;
            case 'date':
            case 'default':
            default:
                break;
        }

        return {
            data: products.slice( from, to ),
            total: products.length
        }
    },
    async getSidebarData( ctx ) {
        let { demo } = ctx.params;

        demo = demo.replace( /demo| |-/gi, '' );

        let demoProducts = findProducts( { "demo": demo }, [ 'large_pictures', 'pictures', 'small_pictures', 'product_categories', 'tags', 'brands' ] )
        let products = [];
        await demoProducts.then( data => { data.forEach( item => products.push( removePrivateData( item ) ) ) } )
        products = products.map( product => { return { ...product, display_price: getMinMaxPrice( product ), discount: Math.round( getDiscount( product ) ) } } )

        if ( ctx.query.only_data ) {
            return { featured: products.filter( item => item.is_featured ).slice( 0, 6 ) }
        }

        let demoCategories = findCategories( { "demo": demo }, [ 'parent', 'children' ] );
        let categories = [];
        await demoCategories.then( data => { data.forEach( item => categories.push( item ) ) } );
        categories = categories.sort( ( itemA, itemB ) => itemA.depth - itemB.depth );

        let categoryList = [];
        let catFlags = Array( categories.length ).fill( false )

        categories.forEach( ( category, index ) => {
            !catFlags[ index ] && categoryList.push( getTree( category ) )
        } )

        function getTree( category ) {
            var result = [];
            if ( category.children.length === 0 )
                return {
                    name: category.name,
                    slug: category.slug,
                    count: products.filter( product => product.product_categories.findIndex( cat => cat.slug === category.slug || category.slug === 'all' ) > -1 ).length
                }

            result.push( category.children.map( item => {
                let cat = categories.find( ( ccat, index ) => {
                    if ( ccat.slug === item.slug && catFlags[ index ] === false ) {
                        catFlags[ index ] = true;
                        return true;
                    }
                } );
                return getTree( cat );
            } ) )

            let flag = true, start = 0, catSlugs = [];
            catSlugs.push( category.slug );

            while ( flag ) {
                let nextStart = catSlugs.length;
                for ( let i = start; i < catSlugs.length; i++ ) {
                    let category = categories.find( cat => cat.slug === catSlugs[ i ] )
                    if ( category && category.children.length > 0 ) {
                        category.children.forEach( item => catSlugs.push( item.slug ) );
                    }
                }
                nextStart === catSlugs.length ? flag = false : start = nextStart;
            }

            return {
                name: category.name,
                slug: category.slug,
                count: products.filter( product => {
                    let catFlag = false;
                    catSlugs.forEach( cat => { if ( product.product_categories.findIndex( itemCat => itemCat.slug === cat || cat === 'all' ) > -1 ) { catFlag = true; } } )
                    return catFlag;
                } ).length,
                children: result
            }
        }

        return {
            categories: categoryList,
            featured: products.filter( item => item.is_featured ).slice( 0, 6 )
        }
    }
};