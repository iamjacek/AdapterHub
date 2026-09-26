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