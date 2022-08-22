module.exports = ( { env } ) => ( {
  host: env( 'HOST', '0.0.0.0' ),
  port: env.int( 'PORT', 1337 ),
  admin: {
    auth: {
      secret: env( 'ADMIN_JWT_SECRET', '580fd8ee77b7e8fc45c230a133a7560b' ),
    },
  },
} );
