<?php

function adapterhub_child_enqueue_styles() {
    wp_enqueue_style(
        'hello-elementor',
        get_template_directory_uri() . '/style.css'
    );

    wp_enqueue_style(
        'adapterhub-child',
        get_stylesheet_directory_uri() . '/style.css',
        array('hello-elementor'),
        wp_get_theme()->get('Version')
    );
}
add_action('wp_enqueue_scripts', 'adapterhub_child_enqueue_styles');

// add shop styles
function adapterhub_shop_styles() {
    if ( is_shop() ) {
        wp_enqueue_style(
            'adapterhub-shop',
            get_stylesheet_directory_uri() . '/shop-style.css',
            array(),
            wp_get_theme()->get('Version')
        );
    }
}
add_action( 'wp_enqueue_scripts', 'adapterhub_shop_styles' );

function adapterhub_product_styles() {
    if ( is_product() ) {
        wp_enqueue_style(
            'adapterhub-product',
            get_stylesheet_directory_uri() . '/product-style.css',
            array(),
            wp_get_theme()->get( 'Version' )
        );
    }
}

add_action( 'wp_enqueue_scripts', 'adapterhub_product_styles' );

function adapterhub_car_brands_styles() {

    if ( is_page( 'car-brands' ) ) {
        wp_enqueue_style(
            'adapterhub-car-brands',
            get_stylesheet_directory_uri() . '/car-brands-style.css',
            array(),
            wp_get_theme()->get( 'Version' )
        );
    }
}

add_action( 'wp_enqueue_scripts', 'adapterhub_car_brands_styles' );

function adapterhub_brand_styles() {

    if ( is_tax( 'product_brand' ) ) {
        wp_enqueue_style(
            'adapterhub-brand',
            get_stylesheet_directory_uri() . '/brand-style.css',
            array(),
            wp_get_theme()->get( 'Version' )
        );
    }
}

add_action( 'wp_enqueue_scripts', 'adapterhub_brand_styles' );

function adapterhub_custom_adapters_styles() {

    if ( is_page( 'custom-adapters' ) ) {
        wp_enqueue_style(
            'adapterhub-custom-adapters',
            get_stylesheet_directory_uri() . '/custom-adapters-style.css',
            array(),
            wp_get_theme()->get( 'Version' )
        );
    }
}

add_action( 'wp_enqueue_scripts', 'adapterhub_custom_adapters_styles' );

function adapterhub_custom_adapters_scripts() {

    if ( ! is_page( 'custom-adapters' ) ) {
        return;
    }

    wp_enqueue_script(
        'adapterhub-custom-adapters',
        get_stylesheet_directory_uri() . '/custom-adapters.js',
        array(),
        wp_get_theme()->get( 'Version' ),
        true
    );
}

add_action( 'wp_enqueue_scripts', 'adapterhub_custom_adapters_scripts' );

function adapterhub_custom_adapters_module( $tag, $handle, $src ) {

    if ( 'adapterhub-custom-adapters' !== $handle ) {
        return $tag;
    }

    return '<script type="module" src="' . esc_url( $src ) . '"></script>';
}

add_filter( 'script_loader_tag', 'adapterhub_custom_adapters_module', 10, 3 );

function adapterhub_guide_product_styles() {
    if ( is_page( 'car-audio-upgrade-guide' ) ) {
        wp_enqueue_style(
            'adapterhub-guide-products',
            get_stylesheet_directory_uri() . '/guide-products-style.css',
            array(),
            wp_get_theme()->get( 'Version' )
        );
    }
}
add_action( 'wp_enqueue_scripts', 'adapterhub_guide_product_styles' );

function adapterhub_search_results_styles() {
    if ( is_search() ) {
        wp_enqueue_style(
            'adapterhub-search-results',
            get_stylesheet_directory_uri() . '/search-results-style.css',
            array(),
            wp_get_theme()->get( 'Version' )
        );
    }
}
add_action( 'wp_enqueue_scripts', 'adapterhub_search_results_styles' );

function adapterhub_cart_styles() {
    if ( is_cart() ) {
        wp_enqueue_style(
            'adapterhub-cart',
            get_stylesheet_directory_uri() . '/cart-style.css',
            array(),
            wp_get_theme()->get( 'Version' )
        );
    }
}
add_action( 'wp_enqueue_scripts', 'adapterhub_cart_styles' );

function adapterhub_my_account_styles() {
    if ( is_page(293) ) {
        wp_enqueue_style(
            'adapterhub-my-account',
            get_stylesheet_directory_uri() . '/my-account-style.css',
            array(),
            wp_get_theme()->get('Version')
        );
    }
}
add_action( 'wp_enqueue_scripts', 'adapterhub_my_account_styles' );