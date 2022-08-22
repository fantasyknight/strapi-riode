'use strict';

module.exports = {
    findPosts ( params, populate ) {
        return strapi.query( 'blogs' ).find( params, populate );
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