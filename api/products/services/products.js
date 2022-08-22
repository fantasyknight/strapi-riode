'use strict';

module.exports = {
    findProducts ( params, populate ) {
        return strapi.query( 'products' ).find( params, populate );
    },

    findPosts ( params, populate ) {
        return strapi.query( 'blogs' ).find( params, populate );
    },

    findCategories ( params, populate ) {
        return strapi.query( 'product-categories' ).find( params, populate );
    },

    getMinMaxPrice ( product ) {
        return product.variants.reduce( ( acc, cur ) => {
            acc[ 0 ] = cur.sale_price ? Math.min( cur.sale_price, acc[ 0 ] ) : cur.price ? Math.min( cur.price, acc[ 0 ] ) : acc[ 0 ];
            acc[ 1 ] = cur.sale_price ? Math.max( cur.sale_price, acc[ 1 ] ) : cur.price ? Math.max( acc[ 1 ], cur.price ) : acc[ 1 ];
            return acc;
        }, [ product.sale_price ? product.sale_price : product.price ? product.price : Infinity, product.price ? product.price : 0 ] );
    },

    getDiscount ( product ) {
        return product.variants.reduce( ( acc, cur ) => {
            acc = cur.sale_price ? [ ( cur.price - cur.sale_price ) * 100 ] / cur.price : acc;
            return acc;
        }, product.sale_price ? [ ( product.price - product.sale_price ) * 100 ] / product.price : 0 )
    },

    isSaleProduct ( product ) {
        if ( product.sale_price ) return true;
        if ( product.variants.length > 0 ) return product.variants.findIndex( item => item.sale_price ) > -1 ? true : false;
        return false;
    },

    removePrivateData ( acc ) {
        let item = { ...acc };

        item.large_pictures && item.large_pictures.forEach( ( picture, index ) => item.large_pictures[ index ] = { width: picture.width, height: picture.height, url: picture.url } )
        item.pictures && item.pictures.forEach( ( picture, index ) => item.pictures[ index ] = { width: picture.width, height: picture.height, url: picture.url } )
        item.small_pictures && item.small_pictures.forEach( ( picture, index ) => item.small_pictures[ index ] = { width: picture.width, height: picture.height, url: picture.url } )
        item.product_categories && item.product_categories.forEach( ( category, index ) => item.product_categories[ index ] = { name: category.name, slug: category.slug } )
        item.blog_categories && item.blog_categories.forEach( ( category, index ) => item.blog_categories[ index ] = { name: category.name, slug: category.slug } )
        item.variants && item.variants.forEach( ( variant, index ) => {
            if ( variant.color && variant.size ) item.variants[ index ] = { price: variant.price, sale_price: variant.sale_price, color: { name: variant.color.name, slug: variant.color.slug, color: variant.color.color }, size: { name: variant.size.name, slug: variant.size.slug, size: variant.size.size } }
            else if ( variant.color && !variant.size ) item.variants[ index ] = { price: variant.price, sale_price: variant.sale_price, color: { name: variant.color.name, slug: variant.color.slug, color: variant.color.color }, size: null }
            else if ( !variant.color && variant.size ) item.variants[ index ] = { price: variant.price, sale_price: variant.sale_price, color: null, size: { name: variant.size.name, slug: variant.size.slug, size: variant.size.size } }
        } )

        return item;
    }
};
